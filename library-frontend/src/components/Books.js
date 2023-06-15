import { useState } from "react";
import { BY_GENRE } from "../queries";
import { useQuery } from "@apollo/client";

const Books = (props) => {
  const [flt, setFlt] = useState("all");
  const books = props?.bookResult?.data?.allBooks;

  const booksByGenreQuery = useQuery(BY_GENRE, {
    variables: { genre: flt !== "all" ? flt : "" },
    //fetchPolicy: "network-only",
  });
  // console.log("result of BYGENRE query booksByGenre", booksByGenreQuery);

  const booksByGenre = booksByGenreQuery.data?.allBooks;

  if (!props.show) {
    return null;
  }

  if (props.bookResult.loading) {
    return <div>loading...</div>;
  }

  if (booksByGenreQuery.loading) {
    return <div>loading...</div>;
  }

  const uniqueGenres = [...new Set(books.flatMap((book) => book.genres))];

  const filterHandler = (filt) => {
    setFlt(filt);
  };

  return (
    <div>
      <h2>books</h2>
      <p>
        in genre <b>{flt}</b>
      </p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksByGenre.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button key={"all"} onClick={() => filterHandler("all")}>
        all genres
      </button>
      {uniqueGenres.map((ug) => (
        <button key={ug} onClick={() => filterHandler(ug)}>
          {ug}
        </button>
      ))}
    </div>
  );
};

export default Books;
