const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const gql = require('graphql-tag');

module.exports = gql(readFileSync(join(__dirname, 'schema.graphql'), 'utf-8'));
