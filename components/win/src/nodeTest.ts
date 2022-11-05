import { createHash } from "crypto";
import { v5 } from "uuid";

const uuidNamespace = "30938e1f-1ad8-4c98-9af0-e9471b52cf1b";
const encrypt = (serials: string[]) => {
  const serial = serials.join("-").toUpperCase();
  const id = createHash("SHA256").update(`${serial}`).digest("base64url");

  return v5(id, uuidNamespace);
};

const main = async () => {
  const names = [
    { name: "3D BASEBALL - THE MAJORS", serials: ["SLUS-00066"] },
    { name: "2XTREME", serials: ["SCUS-94508"] },
    { name: "007 - THE WORLD IS NOT ENOUGH", serials: ["SLUS-01272"] },
  ];

  const encrypted = names.map((v) => encrypt(v.serials));

  console.log(encrypted);
};

main();
