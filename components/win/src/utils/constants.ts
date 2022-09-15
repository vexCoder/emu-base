class Constants {
  static PAL = [
    "Germany",
    "Sweden",
    "Finland",
    "Denmark",
    "Norway",
    "France",
    "Spain",
    "Italy",
    "Netherlands",
    "Belgium",
    "Austria",
  ];

  static NTSCU = ["USA", "Canada", "Mexico", "Brazil", "Argentina", "Chile"];

  static NTSCJ = ["Japan", "Korea", "Taiwan"];

  static DEFAULT_CFG: PartialCFG = {
    notification_show_config_override_load: "false",
    notification_show_cheats_applied: "false",
    notification_show_autoconfig: "false",
    notification_show_fast_forward: "false",
    menu_show_load_content: "false",
    menu_show_load_content_animation: "false",
    menu_show_quit_retroarch: "false",
    menu_show_shutdown: "false",
    pause_nonactive: "false",
    input_driver: "dinput",
    state_slot: "0",
    quit_press_twice: "false",
    input_state_slot_decrease: "f6",
    input_state_slot_increase: "f7",
    input_save_state: "f5",
    menu_pause_libretro: "false",
  };
}

export default Constants;
