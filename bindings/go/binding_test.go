package tree_sitter_helixql_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_helixql "github.com/tree-sitter/tree-sitter-helixql/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_helixql.Language())
	if language == nil {
		t.Errorf("Error loading Helixql grammar")
	}
}
