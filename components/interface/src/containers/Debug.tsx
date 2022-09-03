import { Outlet, useNavigate } from "react-router-dom";

const Debug = () => {
  const nav = useNavigate();
  return (
    <div className="p-5">
      <div className="flex flex-row gap-4">
        <button
          className="border-2 border-gray-500 p-2 rounded-xl text-text"
          type="button"
          onClick={() => nav("/debug/controller")}
        >
          Controller
        </button>
        <button
          className="border-2 border-gray-500 p-2 rounded-xl text-text"
          type="button"
          onClick={() => nav("/debug/controller2")}
        >
          Controller2
        </button>
        <button
          className="border-2 border-gray-500 p-2 rounded-xl text-text"
          type="button"
          onClick={() => nav("/debug/timer")}
        >
          Debug
        </button>
      </div>
      <div className="mt-1">
        <Outlet />
      </div>
    </div>
  );
};

export default Debug;
