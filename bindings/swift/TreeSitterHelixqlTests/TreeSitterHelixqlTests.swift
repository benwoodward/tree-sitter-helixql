import XCTest
import SwiftTreeSitter
import TreeSitterHelixql

final class TreeSitterHelixqlTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_helixql())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Helixql grammar")
    }
}
