import type { IConfiguration } from 'dependency-cruiser'

/** One or more top-level areas under `src/`, matched as whole directories. */
const areas = (...names: readonly string[]) => `^src/(${names.join('|')})(/|$)`
/** Everything the repository owns; anything else is a dependency. */
const owned = '^src/'
const testFile = '\\.test\\.ts$'
// The stdio server entry and its provider wiring; the package's `.` export.
const entrypoints = areas('mcp-server')
// The published `./chatgpt` and `./codex` exports: the only main/ surface a tool module may call.
const mainEntrypoints = ['main/chatgpt/local-store\\.ts$', 'main/codex/app-server\\.ts$']

const config: IConfiguration = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'A cycle is two modules disagreeing about which of them is underneath.',
      severity: 'error',
      from: {},
      to: { circular: true }
    },
    {
      name: 'no-unresolvable',
      comment: 'Every rule matches resolved paths, so an unresolved import would cross any boundary unseen.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true }
    },
    {
      name: 'config-is-the-floor',
      comment: 'Configuration is a plain value every layer receives; it depends on no implementation that consumes it.',
      severity: 'error',
      from: { path: areas('config') },
      to: { path: owned, pathNot: areas('config') }
    },
    {
      name: 'utils-stay-shared',
      comment:
        "Access, audit and result helpers shared with sibling MCPs take config primitives, never this server's implementations, tools or entrypoint.",
      severity: 'error',
      from: { path: areas('utils') },
      to: { path: areas('main', 'tools', 'mcp-server') }
    },
    {
      name: 'main-stays-transport-free',
      comment:
        'The ChatGPT store reader and Codex app-server client in main/ are usable from a script: they never reach the tool layer, the entrypoint or the MCP SDK.',
      severity: 'error',
      from: { path: areas('main') },
      to: { path: `${areas('tools', 'mcp-server')}|(^|/)node_modules/@modelcontextprotocol/` }
    },
    {
      name: 'tools-stay-thin',
      comment:
        'A tool module declares schema and annotations, hands its arguments to a published main/ entrypoint and wraps the result; logic reached past that surface escapes the tested implementation.',
      severity: 'error',
      from: { path: areas('tools'), pathNot: testFile },
      to: {
        path: owned,
        pathNot: `^src/(tools|${mainEntrypoints.join('|')}|config/index\\.ts$|utils/(annotations|results)\\.ts$)`
      }
    },
    {
      name: 'entrypoints-are-not-imported',
      comment:
        'The MCP server and its provider registration load configuration and start the process; nothing outside mcp-server/ may import them.',
      severity: 'error',
      from: { path: owned, pathNot: entrypoints },
      to: { path: entrypoints }
    },
    {
      name: 'registration-tests-keep-the-tool-seam',
      comment:
        'Registration tests assert tool names and provider gating through the registration seam, never by importing main/ implementations or the process entry.',
      severity: 'error',
      from: { path: `^src/(mcp-server/register|tools/.+)${testFile}` },
      to: { path: `${areas('main')}|^src/mcp-server/index\\.ts$` }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // mcporter emits an untracked, unchecked client here; it is not product source.
    exclude: { path: '^src/generated/' },
    tsConfig: { fileName: 'tsconfig.json' },
    // A type-only import crosses a boundary exactly as a value import does.
    tsPreCompilationDeps: true,
    // The MCP SDK and Zod resolve only through subpath exports.
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'types', 'default'],
      extensions: ['.ts', '.js', '.mjs', '.cjs', '.d.ts', '.json']
    }
  }
}

export default config
