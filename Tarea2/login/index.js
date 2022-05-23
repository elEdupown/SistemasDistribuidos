const express = require("express");
const kafka = require("./client");
const fs = require("fs/promises");
const app = express();
app.use(express.json());
const users = require("./users");

app.post("/login", async function (req, res) {
    const user = req.body.user;
    const pass = req.body.pass;
    const bloqFile = await fs.readFile("/bloqUsers.json", "utf-8");
    const bloqUsers = JSON.parse(bloqFile);
    
    const producer = kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner,
      });

    if (bloqUsers.find((blockedUser) => blockedUser == user)) {
      return res.status(401).json({ login: false, error: "user blocked" });
    }

    function validacion(user, pass) {
        const userData = users.find((x) => x.user == user);
        const passData = userData?.pass;
        if (userData?.user == user && passData == pass) {
          return true;
        } else {
          return false;
        }
      }
  
    const validar = validacion(user, pass);
  
    await producer.connect();
    await producer.send({
      topic: "login",
      messages: [
        {
          value: JSON.stringify({
            user,
            validation: validar,
          }),
        },
      ],
    });
  
    if (validar) {
      res.json({ login: true });
    } else {
      res.status(401).json({ login: false, error: "incorrect credentials" });
    }
  });
  
  app.listen(3000);