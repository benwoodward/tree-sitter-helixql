/**
 * @file HelixQL grammar for tree-sitter
 * @author Ben
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'helixql',

  extras: $ => [
    /\s/,           // whitespace
    $.comment,      // comments
  ],

  conflicts: $ => [
    [$.mapping_field, $.evaluates_to_anything],
    [$.new_field, $.mapping_field],
  ],

  rules: {
    // ---------------------------------------------------------------------
    // Main rules
    // ---------------------------------------------------------------------
    source: $ => repeat(choice(
      $.node_def,
      $.edge_def,
      $.vector_def,
      $.query_def,
    )),

    // ---------------------------------------------------------------------
    // Schema definitions
    // ---------------------------------------------------------------------
    vector_def: $ => seq(
      'V::',
      field('name', $.identifier_upper),
      optional(field('body', $.node_body)),
    ),

    node_def: $ => seq(
      'N::',
      field('name', $.identifier_upper),
      optional(field('body', $.node_body)),
    ),

    edge_def: $ => seq(
      'E::',
      field('name', $.identifier_upper),
      field('body', $.edge_body),
    ),

    node_body: $ => seq(
      '{',
      optional($.field_defs),
      '}',
    ),

    edge_body: $ => seq(
      '{',
      'From:',
      field('from', $.identifier_upper),
      ',',
      'To:',
      field('to', $.identifier_upper),
      optional(','),
      optional($.properties),
      '}',
    ),

    field_defs: $ => seq(
      $.field_def,
      repeat(seq(',', $.field_def)),
      optional(','),
    ),

    field_def: $ => seq(
      optional($.index),
      field('name', $.identifier),
      ':',
      field('type', $.param_type),
      optional($.default),
    ),

    index: $ => 'INDEX',

    default: $ => seq(
      'DEFAULT',
      choice(
        $.now,
        $.float,
        $.integer,
        $.boolean,
        $.string_literal,
        $.none,
      ),
    ),

    properties: $ => seq(
      'Properties',
      ':',
      '{',
      optional($.field_defs),
      '}',
    ),

    // ---------------------------------------------------------------------
    // Query definitions
    // ---------------------------------------------------------------------
    query_def: $ => seq(
      'QUERY',
      field('name', $.identifier),
      field('params', $.query_params),
      '=>',
      field('body', optional($.query_body)),
      field('return', $.return_stmt),
    ),

    query_params: $ => seq(
      '(',
      optional(seq(
        $.param_def,
        repeat(seq(',', $.param_def)),
      )),
      ')',
    ),

    param_def: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.param_type),
    ),

    _query_statement: $ => choice(
      $.get_stmt,
      $.AddN,
      $.AddV,
      $.BatchAddV,
      $.AddE,
      $.drop,
      $.for_loop,
    ),

    query_body: $ => repeat1($._query_statement),

    // ---------------------------------------------------------------------
    // Assignments and traversals
    // ---------------------------------------------------------------------
    get_stmt: $ => seq(
      field('variable', $.identifier),
      '<-',
      field('value', $.evaluates_to_anything),
    ),

    traversal: $ => seq(
      choice($.start_node, $.start_edge, $.start_vector),
      repeat($.step),
      optional($.last_step),
    ),

    id_traversal: $ => seq(
      $.identifier,
      choice(
        seq(repeat1($.step), optional($.last_step)),
        $.last_step,
      ),
    ),

    anonymous_traversal: $ => seq(
      '_',
      optional(choice(
        seq($.property_access, optional(seq(repeat($.step), optional($.last_step)))),
        seq(repeat1($.step), optional($.last_step)),
        $.last_step,
      )),
    ),

    property_access: $ => seq(
      '.',
      field('property', $.identifier),
    ),

    step: $ => seq(
      '::',
      choice(
        $.graph_step,
        $.where_step,
        $.closure_step,
        $.object_step,
        $.exclude_field,
        $.count,
        $.ID,
        $.range_step,
        $.AddE,
        $.identifier,  // field/property access
      ),
    ),

    last_step: $ => seq(
      '::',
      choice(
        $.bool_operations,
        $.update,
      ),
    ),

    for_loop: $ => seq(
      'FOR',
      field('argument', $.for_argument),
      'IN',
      field('iterable', $.identifier),
      '{',
      field('body', optional($.query_body)),
      '}',
    ),

    for_argument: $ => choice(
      $.object_access,
      $.object_destructuring,
      $.identifier,
    ),

    object_access: $ => seq(
      field('object', $.identifier),
      '.',
      field('field', $.identifier),
    ),

    object_destructuring: $ => seq(
      '{',
      $.identifier,
      repeat(seq(',', $.identifier)),
      '}',
    ),

    // ---------------------------------------------------------------------
    // Evaluation rules
    // ---------------------------------------------------------------------
    evaluates_to_anything: $ => choice(
      $.AddN,
      $.AddV,
      $.BatchAddV,
      $.search_vector,
      $.AddE,
      $.exists,
      $.none,
      $.traversal,
      $.id_traversal,
      $.object_step,  // for RETURN { ... }
      $.string_literal,
      $.float,
      $.integer,
      $.boolean,
      $.and,
      $.or,
      $.identifier,
    ),

    evaluates_to_bool: $ => choice(
      $.exists,
      $.boolean,
      $.and,
      $.or,
      $.identifier,
      $.traversal,
      $.id_traversal,
    ),

    evaluates_to_number: $ => choice(
      $.float,
      $.integer,
      $.identifier,
      $.traversal,
      $.id_traversal,
    ),

    // ---------------------------------------------------------------------
    // Return statement
    // ---------------------------------------------------------------------
    return_stmt: $ => seq(
      'RETURN',
      $.evaluates_to_anything,
      repeat(seq(',', $.evaluates_to_anything)),
    ),

    // ---------------------------------------------------------------------
    // Creation steps
    // ---------------------------------------------------------------------
    create_field: $ => seq(
      '{',
      $.new_field,
      repeat(seq(',', $.new_field)),
      '}',
    ),

    new_field: $ => seq(
      field('key', $.identifier),
      ':',
      field('value', choice(
        $.anonymous_traversal,
        $.evaluates_to_anything,
        $.create_field,
      )),
    ),

    to_from: $ => prec.left(choice(
      seq($.to, optional($.from)),
      seq($.from, optional($.to)),
    )),

    to: $ => seq('::', 'To', '(', $.id_arg, ')'),

    from: $ => seq('::', 'From', '(', $.id_arg, ')'),

    vec_literal: $ => seq(
      '[',
      $.float,
      repeat(seq(',', $.float)),
      ']',
    ),

    vector_data: $ => choice(
      $.identifier,
      $.vec_literal,
    ),

    AddN: $ => seq(
      'AddN',
      seq('<', $.identifier_upper, '>'),
      optional(seq('(', optional($.create_field), ')')),
    ),

    AddE: $ => seq(
      'AddE',
      seq('<', $.identifier_upper, '>'),
      optional(seq('(', optional($.create_field), ')')),
      $.to_from,
    ),

    AddV: $ => seq(
      'AddV',
      seq('<', $.identifier_upper, '>'),
      seq(
        '(',
        $.vector_data,
        repeat(seq(',', $.create_field)),
        ')',
      ),
    ),

    // ---------------------------------------------------------------------
    // Source steps
    // ---------------------------------------------------------------------
    start_node: $ => seq(
      'N',
      optional(seq('<', $.type_args, '>')),
      optional(seq('(', choice($.id_args, $.by_index), ')')),
    ),

    start_edge: $ => seq(
      'E',
      optional(seq('<', $.type_args, '>')),
      optional(seq('(', choice($.id_args, $.by_index), ')')),
    ),

    start_vector: $ => seq(
      'V',
      optional(seq('<', $.type_args, '>')),
      optional(seq('(', choice($.id_args, $.by_index), ')')),
    ),

    by_index: $ => seq(
      '{',
      $.id_arg,
      ':',
      $.evaluates_to_anything,
      '}',
    ),

    // ---------------------------------------------------------------------
    // Traversal steps
    // ---------------------------------------------------------------------
    graph_step: $ => choice(
      $.out_e,
      $.in_e,
      $.from_n,
      $.to_n,
      $.out,
      $.in_nodes,
      $.shortest_path,
    ),

    out_e: $ => seq('OutE', optional(seq('<', $.type_args, '>'))),
    in_e: $ => seq('InE', optional(seq('<', $.type_args, '>'))),
    from_n: $ => 'FromN',
    to_n: $ => 'ToN',
    out: $ => seq('Out', optional(seq('<', $.type_args, '>'))),
    in_nodes: $ => seq('In', optional(seq('<', $.type_args, '>'))),
    shortest_path: $ => seq(
      'ShortestPath',
      optional(seq('<', $.type_args, '>')),
      $.to_from,
    ),

    // ---------------------------------------------------------------------
    // Util steps
    // ---------------------------------------------------------------------
    where_step: $ => seq(
      'WHERE',
      '(',
      choice($.evaluates_to_bool, $.anonymous_traversal),
      ')',
    ),

    exists: $ => seq(
      'EXISTS',
      '(',
      choice($.traversal, $.id_traversal, $.anonymous_traversal),
      ')',
    ),

    range_step: $ => seq(
      'RANGE',
      '(',
      $.evaluates_to_number,
      ',',
      $.evaluates_to_number,
      ')',
    ),

    count: $ => 'COUNT',
    none: $ => 'NONE',
    ID: $ => 'ID',

    update_field: $ => seq(
      field('key', $.identifier),
      ':',
      field('value', choice($.evaluates_to_anything, $.anonymous_traversal)),
    ),

    update: $ => seq(
      'UPDATE',
      '(',
      '{',
      $.update_field,
      repeat(seq(',', $.update_field)),
      '}',
      ')',
    ),

    drop: $ => prec.left(seq(
      'DROP',
      optional(choice(
        $.traversal,
        $.id_traversal,
        $.identifier,
      )),
    )),

    // ---------------------------------------------------------------------
    // Vector steps
    // ---------------------------------------------------------------------
    search_vector: $ => seq(
      'SearchV',
      '<',
      $.identifier_upper,
      '>',
      '(',
      $.vector_data,
      ',',
      choice($.integer, $.identifier),
      ')',
    ),

    pre_filter: $ => seq(
      'PREFILTER',
      '(',
      choice($.evaluates_to_bool, $.anonymous_traversal),
      ')',
    ),

    BatchAddV: $ => seq(
      'BatchAddV',
      '<',
      $.identifier_upper,
      '>',
      '(',
      $.identifier,
      ')',
    ),

    // ---------------------------------------------------------------------
    // Boolean operations
    // ---------------------------------------------------------------------
    and: $ => seq(
      'AND',
      '(',
      choice($.evaluates_to_bool, $.anonymous_traversal),
      repeat(seq(',', choice($.evaluates_to_bool, $.anonymous_traversal))),
      ')',
    ),

    or: $ => seq(
      'OR',
      '(',
      choice($.evaluates_to_bool, $.anonymous_traversal),
      repeat(seq(',', choice($.evaluates_to_bool, $.anonymous_traversal))),
      ')',
    ),

    bool_operations: $ => choice(
      $.GT,
      $.GTE,
      $.LT,
      $.LTE,
      $.EQ,
      $.NEQ,
    ),

    GT: $ => seq('GT', '(', choice($.evaluates_to_number, $.anonymous_traversal), ')'),
    GTE: $ => seq('GTE', '(', choice($.evaluates_to_number, $.anonymous_traversal), ')'),
    LT: $ => seq('LT', '(', choice($.evaluates_to_number, $.anonymous_traversal), ')'),
    LTE: $ => seq('LTE', '(', choice($.evaluates_to_number, $.anonymous_traversal), ')'),
    EQ: $ => seq('EQ', '(', choice($.evaluates_to_anything, $.anonymous_traversal), ')'),
    NEQ: $ => seq('NEQ', '(', choice($.evaluates_to_anything, $.anonymous_traversal), ')'),

    // ---------------------------------------------------------------------
    // Object access and remapping steps
    // ---------------------------------------------------------------------
    object_step: $ => prec.left(seq(
      '{',
      optional(seq(
        $.mapping_field,
        repeat(seq(',', $.mapping_field)),
        optional(','),
      )),
      optional($.spread_object),
      '}',
    )),

    exclude_field: $ => seq(
      '!',
      '{',
      $.identifier,
      repeat(seq(',', $.identifier)),
      optional(seq(',', $.spread_object)),
      '}',
    ),

    closure_step: $ => seq(
      '|',
      $.identifier,
      '|',
      $.object_step,
    ),

    spread_object: $ => seq('..', optional(',')),

    mapping_field: $ => choice(
      seq(
        $.identifier,
        optional(seq(
          ':',
          choice($.anonymous_traversal, $.evaluates_to_anything, $.object_step),
        )),
      ),
      $.identifier,
    ),

    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------
    type_args: $ => seq(
      $.identifier_upper,
      repeat(seq(',', $.identifier_upper)),
    ),

    id_arg: $ => choice(
      $.id_traversal,
      $.identifier,
      $.string_literal,
    ),

    id_args: $ => seq(
      $.id_arg,
      repeat(seq(',', $.id_arg)),
    ),

    array: $ => seq('[', $.param_type, ']'),

    object: $ => seq('{', optional($.field_defs), '}'),

    named_type: $ => choice(
      'String',
      'Boolean',
      'F32',
      'F64',
      'I8',
      'I16',
      'I32',
      'I64',
      'U8',
      'U16',
      'U32',
      'U64',
      'U128',
    ),

    ID_TYPE: $ => 'ID',

    date_type: $ => 'Date',

    param_type: $ => choice(
      $.named_type,
      $.date_type,
      $.ID_TYPE,
      $.array,
      $.object,
      $.identifier,
    ),

    // ---------------------------------------------------------------------
    // Literals
    // ---------------------------------------------------------------------
    string_literal: $ => token(seq(
      '"',
      repeat(choice(
        /[^"\\]/,
        seq('\\', /./)
      )),
      '"',
    )),

    boolean: $ => choice('true', 'false'),

    identifier: $ => token(seq(
      /[a-zA-Z]/,
      repeat(/[a-zA-Z0-9_]/),
    )),

    identifier_upper: $ => token(seq(
      /[A-Z]/,
      repeat(/[a-zA-Z0-9_]/),
    )),

    integer: $ => token(/\d+/),

    float: $ => token(seq(
      /\d+/,
      '.',
      /\d+/,
    )),

    now: $ => 'NOW',

    // ---------------------------------------------------------------------
    // Whitespace and comments
    // ---------------------------------------------------------------------
    comment: $ => token(seq('//', /.*/)),
  },
});
