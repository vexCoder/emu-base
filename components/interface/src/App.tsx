/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/button-has-type */
import ImageCache from "@components/Cache/ImageCache";
import useGetGames from "@hooks/useGetGames";
import { useToggle } from "@react-hookz/web";

const App = () => {
  const [open, toggle] = useToggle(true);

  return (
    <div>
      <button onClick={toggle}>Toggle</button>
      {open && <Test />}
    </div>
  );
};

const Test = () => {
  const { data, loading } = useGetGames({
    keyword: "parasite",
    console: "ps1",
  });

  return (
    <div>
      <h1>{loading ? "Loading" : "Idle"}</h1>
      <div>
        {data.map((v) => (
          // helper utils for generating image path based on path and url
          <div style={{ display: "flex", flexDirection: "column" }} key={v.id}>
            <pre>{JSON.stringify(v, null, 2)}</pre>
            <ImageCache path={`ps1/${v.unique}/cover.png`} url={v.cover} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
