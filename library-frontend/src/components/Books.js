const Books = (props) => {
  if (!props.show) {
    return null;
  }

  if (props.bookResult.loading) {
    return <div>loading...</div>;
  }

  const books = props.bookResult.data.allBooks;
  // console.log(props.bookResult);
  // console.log(books);

  // books.map((a) => {
  //   console.log(
  //     "title: ",
  //     a.title,
  //     "published: ",
  //     a.published,
  //     "author:",
  //     a.author
  //   );
  // });
  //  const books = [];

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
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

export default Books;
