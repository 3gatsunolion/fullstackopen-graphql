import { useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import Recommend from "./components/Recommend";
import LoginForm from "./components/LoginForm";
import Notification from "./components/Notification";
import persistentUserService from "./services/persistentUserService";
import { useApolloClient, useSubscription } from "@apollo/client/react";
import { BOOK_ADDED } from "./queries";
import { addBookToCache } from "./utils/apolloCache";
import { useNotificationActions } from "./hooks/useNotification";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(persistentUserService.getToken());
  const client = useApolloClient();
  const { clearNotification } = useNotificationActions();

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const addedBook = data.data.bookAdded;
      addBookToCache(client.cache, addedBook);
      window.alert(
        `"${addedBook.title}" by ${addedBook.author.name} was added!`,
      );
    },
  });

  const onLogin = (token) => {
    clearNotification();
    persistentUserService.saveToken(token);
    setToken(token);
    setPage("authors");
    client.cache.evict({
      id: "ROOT_QUERY",
      fieldName: "me",
    });

    client.cache.gc();
  };

  const onLogout = async () => {
    clearNotification();
    setToken(null);
    persistentUserService.removeToken();
    // Clearing the cache is important, because some queries may have fetched data into the cache that
    // only an authenticated user is allowed to access.

    if (page !== "authors" && page !== "books" && page !== "login") {
      // No need to refetch since we're "redirecting" to new page
      await client.clearStore();
      setPage("authors");
    } else {
      await client.resetStore();
    }
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {token && <button onClick={() => setPage("add")}>add book</button>}
        {token && (
          <button onClick={() => setPage("recommend")}>recommend</button>
        )}
        {token ? (
          <button onClick={onLogout}>logout</button>
        ) : (
          <button onClick={() => setPage("login")}>login</button>
        )}
      </div>

      <Notification />

      <Authors show={page === "authors"} />

      <Books show={page === "books"} />

      <NewBook show={page === "add"} />

      {page === "login" && <LoginForm onLogin={onLogin} />}

      {page === "recommend" && <Recommend />}
    </div>
  );
};

export default App;
