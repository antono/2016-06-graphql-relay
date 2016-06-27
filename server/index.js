const express = require('express');
const session = require('express-session');
const graphqlHTTP = require('express-graphql');

const schema = require('./schema');

const app = express();

app.use('/', express.static(__dirname + '/../'));
app.use(session({ secret: 'wowowow', cookie: { maxAge: 60000 }}));

app.use('/graphql', graphqlHTTP((request) => ({
  schema: schema,
  graphiql: true,
  context: request.session,
  pretty: true
})));

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on http://localhost:3000/");
});
