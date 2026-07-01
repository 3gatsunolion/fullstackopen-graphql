import { useQuery } from "@apollo/client/react";
import { ALL_BOOKS, ME } from "../queries";

const Recommend = () => {
  const { data: userData, loading: userLoading } = useQuery(ME);

  const favoriteGenre = userData?.me?.favoriteGenre;

  // Note: The default is fetch policy is cache-first.
  // This means:
  // Apollo client first fetches from the server if not in cache.
  // Subsequent calls of the same query: uses the cache, no new request.
  const result = useQuery(ALL_BOOKS, {
    skip: !favoriteGenre,
    variables: { genre: favoriteGenre },
  });

  if (userLoading || result.loading) {
    return <div>loading...</div>;
  }

  if (result.error) {
    return <div>something happened :(</div>;
  }

  const books = result.data.allBooks;

  return (
    <div>
      <h2>recommendations</h2>
      <div>
        books in your favorite genre <b>{favoriteGenre}</b>
      </div>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((b) => (
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>{b.author.name}</td>
              <td>{b.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommend;
