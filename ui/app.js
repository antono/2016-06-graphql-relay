require('babel-polyfill');

const ReactDOM = require('react-dom');
const React = require('react');
const Relay = require('react-relay');

class App extends React.Component {
  render() {
    console.log(this.props);
    return (
      <div>
        <h1>Todo Lists</h1>
        <ul>
          {this.props.root.lists.map(list =>
            <li key={list.id}>
              {list.title} (ID: {list.id})
              <ul>
                {list.items.map(item =>
                  <li key={item.id}> {item.done ? '[done]' : ''} {item.title}</li>
                )}
              </ul>
            </li>
          )}
        </ul>
      </div>
    );
  }
}

class AppHomeRoute extends Relay.Route {
  static queries = {
    root: () => Relay.QL`
      query { rootHack }
    `,
  };
  static routeName = 'AppHomeRoute';
}

const RelayContainer = Relay.createContainer(App, {
  fragments: {
    root: () => Relay.QL`
      fragment on RootQueries {
        lists {
          id
          title
          items {
            id
            title
            done
          }
        }
      }
    `,
  },
});

ReactDOM.render(
  <Relay.RootContainer
    Component={RelayContainer}
    route={new AppHomeRoute()}
  />,
  document.getElementById('root')
);
