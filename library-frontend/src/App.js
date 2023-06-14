import { useState } from "react";
import { useQuery, useApolloClient, useSubscription } from "@apollo/client";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import Recommendations from "./components/Recommendations";

import { ALL_AUTHORS, ALL_BOOKS, BOOK_ADDED, BY_GENRE } from "./queries";

const Notify = ({ errorMessage }) => {
  if (!errorMessage) {
    return null;
  }
  return <div style={{ color: "red" }}>{errorMessage}</div>;
};

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const authorResult = useQuery(ALL_AUTHORS);
  const bookResult = useQuery(ALL_BOOKS);
  const client = useApolloClient();

  const notify = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 4000);
  };

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
    setPage("authors");
  };

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      console.log(data);
      console.log(data?.data?.bookAdded?.title);
      const addedBook = data.data.bookAdded.title;
      //window.alert("New book added" + data.data?.bookAdded?.title);
      notify("New book added" + addedBook);
      client.cache.updateQuery({ query: ALL_BOOKS }, ({ allBooks }) => {
        return {
          allBooks: allBooks.concat(addedBook),
        };
      });
      client.cache.updateQuery({ query: BY_GENRE }, ({ allBooks }) => {
        return {
          allBooks: allBooks.concat(addedBook),
        };
      });
    },
  });

  return (
    <div>
      <div>
        <Notify errorMessage={errorMessage} />
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {token && <button onClick={() => setPage("add")}>add book</button>}
        {token && (
          <button onClick={() => setPage("recommended")}>recommended</button>
        )}
        {!token && <button onClick={() => setPage("login")}>login</button>}
        {token && <button onClick={logout}>logout</button>}
      </div>
      <Authors show={page === "authors"} authorResult={authorResult} />
      <Books show={page === "books"} bookResult={bookResult} />
      <NewBook show={page === "add"} />
      <Recommendations show={page === "recommended"} bookResult={bookResult} />
      <LoginForm
        show={page === "login"}
        setToken={setToken}
        setError={notify}
      />
    </div>
  );
};

export default App;
