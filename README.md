# tree-sitter-helixdb

[![CI][ci]](https://github.com/benwoodward/tree-sitter-helixdb/actions/workflows/ci.yml)

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
                url = "https://github.com/benwoodward/tree-sitter-helixdb",
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

- [HelixDB Documentation](https://helix-db.com/docs)
- [HelixQL Language Reference](https://helix-db.com/docs/languages/helixql)

[ci]: https://img.shields.io/github/actions/workflow/status/benwoodward/tree-sitter-helixdb/ci.yml?logo=github&label=CI
