const Authors = (props) => {
  if (!props.show) {
    return null;
  }
  //const authors = [];

  if (props.authorResult.loading) {
    return <div>loading...</div>;
  }

  const authors = props.authorResult.data.allAuthors;

  // console.log("in component Authors ", props.authorResult);
  // console.log("authors", authors);
  // console.log(typeof authors);
  //  console.log("authors.allAuthors", authors.allAuthors);

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
    </div>
  );
};

export default Authors;
