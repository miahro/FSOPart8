import { useState } from "react";
import { useMutation } from "@apollo/client";

import { CREATE_BOOK, ALL_BOOKS, ALL_AUTHORS, BY_GENRE } from "../queries";

const NewBook = (props, { setError }) => {
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [published, setPublished] = useState("");
  const [genre, setGenre] = useState("");
  const [genres, setGenres] = useState([]);

  const [createBook] = useMutation(CREATE_BOOK, {
    refetchQueries: [
      { query: ALL_BOOKS },
      { query: ALL_AUTHORS },
      { query: BY_GENRE },
    ],
    onError: (error) => {
      console.log("error in create book: ", error);
    },
  });

  if (!props.show) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();

    createBook({
      variables: {
        title: title,
        name: authorName,
        published: parseInt(published),
        genres: genres,
      },
    });

    setTitle("");
    setPublished("");
    setAuthorName("");
    setGenres([]);
    setGenre("");
  };

  const addGenre = () => {
    setGenres(genres.concat(genre));
    console.log("in addGenre, genre", genre, "genres: ", genres);
    setGenre("");
  };

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={authorName}
            onChange={({ target }) => setAuthorName(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(" ")}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  );
};

export default NewBook;
