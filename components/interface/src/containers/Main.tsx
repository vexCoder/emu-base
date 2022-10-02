import GameList from "@components/GameList/GameList";
import Header from "@components/Header/Header";

const Main = () => {
  return (
    <div className="bg-primary h-[100vh] flex flex-col items-start">
      <Header />
      <GameList />
    </div>
  );
};

export default Main;
