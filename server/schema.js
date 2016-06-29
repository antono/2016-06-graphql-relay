const fetch = require('node-fetch');
const {UserError} = require('graphql-errors');

const {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLID,
  GraphQLUnionType,
  GraphQLNonNull
} = require('graphql');

const lists = [
    { id: 1, title: 'Learn GraphQL' },
    { id: 2, title: 'Learn Relay' },
];

const items = [
  { id: 1, listId: 1, title: 'Read introduction', done: true },
  { id: 2, listId: 1, title: 'Read GraphQL by example', done: false },
  { id: 3, listId: 1, title: 'Implement simple GraphQL server', done: false },
  { id: 4, listId: 1, title: 'Implement simple GraphQL client', done: false },
  { id: 5, listId: 2, title: 'Read introduction', done: false },
  { id: 6, listId: 2, title: 'Read Relay examples', done: false },
]

const TodoIdType = GraphQLID;

const getRandomId = () => Math.floor(Math.random() * 10000);

const TodoList = new GraphQLObjectType({
  name: 'TodoList',
  description: 'Represents TODO List',
  fields: () => ({
    id: {
      type: TodoIdType,
      description: 'List ID'
    },
    title: {
      type: GraphQLString,
      description: 'Title for TODO List',
    },
    items: {
      type: new GraphQLList(TodoItem),
      description: 'TODO Items for list',
      resolve(parent) {
        return items.filter(item => item.listId === parent.id);
      }
    },
    itemsCount: {
      type: GraphQLInt,
      description: 'Count of todo items in this list',
      resolve(parent) {
        return items.filter(item => item.listId === parent.id).length;
      }
    }
  })
});

const TodoItem = new GraphQLObjectType({
  name: 'TodoItem',
  description: 'Represents signle TODO item',
  fields: () => ({
    id: {
      type: TodoIdType,
      description: 'Item ID'
    },
    title: {
      type: GraphQLString,
      description: 'TODO Item Title'
    },
    done: {
      type: GraphQLBoolean,
      description: 'TODO Item is done'
    },
    list: {
      type: TodoList,
      description: 'TODO List',
      resolve: (parent) => lists.find(list => list.id === parent.listId)
    },
    status: {
      type: GraphQLString,
      deprecationReason: 'Use done instead'
    }
  })
});

const RootQueries = new GraphQLObjectType({
  name: 'RootQueries',
  description: 'Root queries for TODO schema',
  fields: () => ({
    echo: {
      type: GraphQLString,
      description: 'Echo recieved message',
      args: {
        message: { type: GraphQLString }
      },
      resolve(parent, args) {
        return `Recieved ${args.message}`;
      }
    },
    list: {
      type: TodoList,
      description: 'Get TODO List by id',
      args: {
        id: { type: TodoIdType }
      },
      resolve(parent, args) {
        const id = parseInt(args.id);
        return lists.find(list => list.id === id);
      }
    },
    lists: {
      type: new GraphQLList(TodoList),
      description: 'Get list of TODO lists',
      args: {
        offset: {
          type: GraphQLInt,
          defaultValue: 0
        },
        limit: {
          type: GraphQLInt,
          defaultValue: 10
        },
      },
      resolve(parent, {offset, limit}) {
        return lists.slice(offset, offset + limit);
      }
    },
    item: {
      type: TodoItem,
      description: 'Get TODO Item by ID',
      args: {
        id: { type: TodoIdType }
      },
      resolve(parent, args) {
        const id = parseInt(args.id);
        return items.find(item => item.id === id);
      }
    },
    items: {
      type: new GraphQLList(TodoItem),
      description: 'List of TODO Items',
      args: {
        offset: {
          type: GraphQLInt,
          defaultValue: 0
        },
        limit: {
          type: GraphQLInt,
          defaultValue: 10
        },
        done: {
          type: GraphQLBoolean,
          defaultValue: undefined
        }
      },
      resolve(parent, {offset, limit, done}) {
        let result = items.slice(offset, offset + limit);

        if (done !== undefined) {
          result = items.filter(item => done === item.done);
        }

        return result;
      }
    },

    rootHack: {
      type: new GraphQLNonNull(RootQueries),
      resolve: () => ({})
    },
  })
});

const RootMutations = new GraphQLObjectType({
  name: 'RootMutations',
  description: 'Root mutations for TODO schema',
  fields: () => ({
    upsertItem: {
      type: TodoItem,
      description: 'Upsert TODO Item',
      args: {
        id: { type: GraphQLInt },
        title: { type: GraphQLString },
        done: { type: GraphQLBoolean },
      },
      resolve(_, args) {
        let item;

        if (args.id) {
          item = items.find(item => item.id === args.id);
        }

        if (!item) {
          item = { id: getRandomId() };
          items.push(item);
        }

        return Object.assign(item, args);
      }
    },

    upsertList: {
      type: TodoList,
      description: 'Upsert TODO List',
      args: {
        id: { type: GraphQLInt },
        title: { type: GraphQLString },
      },
      resolve(_, args) {
        let list;

        if (args.id) {
          list = lists.find(list => list.id === args.id);
        }

        if (!list) {
          list = { id: getRandomId() };
          lists.push(list);
        }

        return Object.assign(list, args);
      }
    },

    moveTodo: {
      type: TodoItem,
      description: 'Move TODO item to another list',
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLInt),
          description: 'TODO Item ID'
        },
        listId: {
          type: new GraphQLNonNull(GraphQLInt),
          description: 'Destination TODO List ID'
        }
      },
      resolve(_, args) {
        const item = items.find(item => item.id === args.id);
        const list = lists.find(list => list.id === args.listId);

        if (!list) throw new UserError('Wrong id for TODO list');
        if (!item) throw new UserError('Wrong id for TODO item');

        item.listId = args.listId;

        return item;
      }
    },

    removeItem: {
      type: TodoItem,
      description: 'Remove todo item by ID',
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve(parent, args) {
        const item = items.find(item => item.id === args.id);

        if (!item) throw new UserError(`Cannot item with id ${args.id}`);

        items.splice(items.indexOf(item), 1);

        return item;
      }
    },

    removeList: {
      type: TodoList,
      description: 'Remove todo item by ID',
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve(parent, args) {
        const list = lists.find(list => list.id === args.id)

        if (!list) throw new UserError(`Cannot find wist with id ${args.id}`);

        lists.splice(lists.indexOf(list), 1);

        return list;
      }
    }
  })
});

const schema = new GraphQLSchema({
  query: RootQueries,
  mutation: RootMutations,
});

module.exports = schema;
