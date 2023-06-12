import { useState } from "react";
const Books = (props) => {
  const [flt, setFlt] = useState("all");
  const books = props?.bookResult?.data?.allBooks;

  if (!props.show) {
    return null;
  }

  if (props.bookResult.loading) {
    return <div>loading...</div>;
  }

  const uniqueGenres = [...new Set(books.flatMap((book) => book.genres))];

  const filterHandler = (filt) => {
    setFlt(filt);
  };

  const filteredBooks = () => {
    if (flt === "all") {
      return books;
    }
    return books.filter((book) => book.genres.includes(flt));
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
          {filteredBooks().map((a) => (
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
