import { useState } from "react";
import { useMutation } from "@apollo/client";
import { SET_BIRTH, ALL_AUTHORS } from "../queries";

const Authors = (props) => {
  const [name, setName] = useState("");
  const [born, setBorn] = useState("");

  const [editYear] = useMutation(SET_BIRTH, {
    refetchQueries: [{ query: ALL_AUTHORS }],
    onError: (error) => {
      console.log("error in edit Year: ", error);
    },
  });

  if (!props.show) {
    return null;
  }
  //const authors = [];

  if (props.authorResult.loading) {
    return <div>loading...</div>;
  }
  const authors = props.authorResult.data.allAuthors;

  const submit = async (event) => {
    event.preventDefault();

    editYear({
      variables: {
        name: name,
        born: parseInt(born),
      },
    });

    setName("");
    setBorn("");
  };

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
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        <div>
          name
          <input
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
        </div>
        <div>
          born
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  );
};

export default Authors;
