# tree-sitter-helixql

[![CI][ci]](https://github.com/benwoodward/tree-sitter-helixql/actions/workflows/ci.yml)

Tree-sitter grammar for HelixQL, the query language for [HelixDB](https://helix-db.com).

## Installation

### Neovim (via nvim-treesitter)

If HelixQL is already in nvim-treesitter:

```vim
:TSInstall helixql
```

If not yet merged, add this to your Neovim config:

```lua
vim.api.nvim_create_autocmd("User", {
    pattern = "TSUpdate",
    callback = function()
        require("nvim-treesitter.parsers").helixql = {
            install_info = {
                url = "https://github.com/benwoodward/tree-sitter-helixql",
                files = { "src/parser.c" },
                branch = "main",
            },
            tier = 3,
        }
    end,
})
```

Then enable treesitter for helixql files:

```lua
vim.filetype.add({
    extension = {
        hx = "helixql",
    },
})
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- [tree-sitter CLI](https://github.com/tree-sitter/tree-sitter/tree/master/cli)

### Install dependencies

```sh
npm install
```

### Build and test

```sh
npm run generate  # Generate parser from grammar.js
npm run test      # Run tests
```

### Testing in Neovim (local development)

To test changes to the grammar in Neovim, add this to your config (e.g., `~/.config/nvim/lua/config/autocmds.lua`):

```lua
-- Register local parser
local function register_helixql_parser()
  local ok, parsers = pcall(require, "nvim-treesitter.parsers")
  if ok then
    parsers.helixql = {
      install_info = {
        path = "/path/to/tree-sitter-helixql",  -- Update this path
        files = { "src/parser.c", "src/scanner.c" },
      },
      filetype = "helixql",
    }
  end
end

vim.api.nvim_create_autocmd("VimEnter", {
  callback = function() vim.schedule(register_helixql_parser) end,
})

vim.api.nvim_create_autocmd("User", {
  pattern = "TSUpdate",
  callback = register_helixql_parser,
})

-- Filetype detection
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
  pattern = "*.hx",
  callback = function() vim.bo.filetype = "helixql" end,
})

-- Enable highlighting
vim.api.nvim_create_autocmd("FileType", {
  pattern = "helixql",
  callback = function(args)
    vim.treesitter.start(args.buf, "helixql")
  end,
})
```

Create a symlink for query files:

```sh
mkdir -p ~/.config/nvim/queries
ln -sf /path/to/tree-sitter-helixql/queries ~/.config/nvim/queries/helixql
```

Install the parser:

```vim
:TSInstallFromGrammar helixql
```

After making changes to `grammar.js`, run `npm run generate` and restart Neovim.

## File Types

This grammar supports `.hx` files.

## Features

The grammar supports:

- **Schema definitions**: Node (`N::`), Edge (`E::`), and Vector (`V::`) types
- **Queries**: Function-style query definitions with parameters
- **Traversals**: Graph navigation operators (`OutE`, `InE`, `FromN`, `ToN`, etc.)
- **Filters**: `WHERE` clauses with comparison operators
- **Mutations**: `AddN`, `AddE`, `AddV`, `UPDATE`, `DROP`
- **Vector search**: `SearchV` for similarity search
- **Control flow**: `FOR` loops, `RETURN` statements
- **Object mapping**: Property remapping and projection

## References

- [HelixDB Documentation](https://docs.helix-db.com/)
- [HelixQL Language Reference](https://docs.helix-db.com/documentation/hql/hql)

[ci]: https://img.shields.io/github/actions/workflow/status/benwoodward/tree-sitter-helixql/ci.yml?logo=github&label=CI
