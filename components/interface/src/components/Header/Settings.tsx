import FilePicker from "@elements/FilePicker";
import Modal from "@elements/Modal";
import useNavigate from "@hooks/useNavigate";
import { useMount, useSetState, useToggle } from "ahooks";

interface SettingsProps {
  id?: string;
}

const Settings = ({ id }: SettingsProps) => {
  const [fpOpen, toggleFp] = useToggle(true);
  const [settings, setSettings] = useSetState<Partial<ConsoleSettings>>({});

  useMount(() => {
    if (id) {
      window.data.getConsole(id).then(setSettings);
    }
  });

  const { focus } = useNavigate("game-settings");

  return (
    <>
      <Modal
        duration={0.3}
        open={fpOpen}
        handleClose={() => {
          toggleFp.set(false);
          focus();
        }}
      >
        <FilePicker
          options={{ folderOnly: true }}
          onClose={() => {
            toggleFp.set(false);
            focus();
          }}
        />
      </Modal>
      <div>
        <h6 className="font-bold text-text leading-[1em]">Global Settings</h6>
        <div className="v-stack" />
        <h6 className="font-bold text-text leading-[1em]">Console Settings</h6>
      </div>
    </>
  );
};

export default Settings;
