import { useQuery } from "@apollo/client/react";
import { ALL_AUTHORS, ME } from "../queries";
import EditAuthorForm from "./EditAuthorForm";

const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS, {
    skip: !props.show,
  });

  const { data: userData } = useQuery(ME);

  if (!props.show) {
    return null;
  }

  if (result.loading) {
    return <div>loading...</div>;
  }

  if (result.error) {
    return <div>something happened :(</div>;
  }

  const authors = result.data.allAuthors;

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {userData?.me?.username && <EditAuthorForm authors={authors} />}
    </div>
  );
};

export default Authors;
