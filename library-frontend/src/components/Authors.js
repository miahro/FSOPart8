import { useState } from "react";
import { useMutation } from "@apollo/client";
import Select from "react-select";
import { SET_BIRTH, ALL_AUTHORS } from "../queries";

const Authors = (props) => {
  const [born, setBorn] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

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
    setSelectedOption(null);
    setBorn("");
  };

  const handleChange = (selectedOption) => {
    setSelectedOption(selectedOption);
  };

  const name = selectedOption ? selectedOption.value : "";

  const token = localStorage.getItem("token");

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
        {/* <div>
          name
          <input
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
        </div> */}
        <Select
          name="name"
          value={selectedOption}
          onChange={handleChange}
          options={authors.map((a) => ({ value: a.name, label: a.name }))}
        />
        <div>
          born
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        {token && <button type="submit">update author</button>}
      </form>
    </div>
  );
};

export default Authors;
