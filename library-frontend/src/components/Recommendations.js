import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { ME } from "../queries";

const Recommendations = (props) => {
  const [flt, setFlt] = useState("all");
  const books = props?.bookResult?.data?.allBooks;

  const user = useQuery(ME);

  useEffect(() => {
    console.log("are we running useEffect at all?");
    if (user.data?.me) {
      console.log("are we ever getting here? with user details", user.data);
      setFlt(user.data.me.favoriteGenre);
    }
  }, [user]);

  if (!props.show) {
    return null;
  }

  if (props.bookResult.loading) {
    return <div>loading...</div>;
  }

  const filteredBooks = () => {
    console.log(flt);
    if (flt === "all") {
      return books;
    }
    return books.filter((book) => book.genres.includes(flt));
  };

  return (
    <div>
      <h2>recommendations</h2>
      <p>
        books in your favorite genre <b>{flt}</b>
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
    </div>
  );
};

export default Recommendations;
