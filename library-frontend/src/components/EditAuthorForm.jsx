import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { EDIT_AUTHOR_BORN } from "../queries";
import useField from "../hooks/useField";
import { useNotificationActions } from "../hooks/useNotification";

const EditAuthorForm = ({ authors }) => {
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const { reset: resetBorn, ...born } = useField("number");
  const { showNotification } = useNotificationActions();

  // Don't need to refetch to update authors because Apollo Client
  // normalizes its cache, and because each author has an identifying field of type ID,
  // the author's details saved to the cache update automatically when they are changed with the mutation.
  const [editAuthorBorn] = useMutation(EDIT_AUTHOR_BORN, {
    onError: (e) =>
      showNotification(`Could not edit author. ${e.message}`, true),
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    editAuthorBorn({
      variables: { name: selectedAuthor, born: parseInt(born.value) || 0 },
    });

    resetBorn();
  };

  return (
    <div>
      <h3>Set birthyear</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            name
            <select
              name="name"
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
            >
              {authors.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            born
            <input {...born} />
          </label>
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  );
};

export default EditAuthorForm;
