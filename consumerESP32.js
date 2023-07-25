import express, { json } from 'express';
import { connect as _connect } from 'amqplib';
import cors from 'cors';
import http from 'http'; // Importa la librería http
import { Server } from 'socket.io'; // Importa la clase Server de Socket.io

const app = express();
const server = http.createServer(app); // Crea un servidor HTTP utilizando Express
const io = new Server(server); // Crea una instancia de Socket.io vinculada al servidor HTTP
const QUEUE_NAME = 'mqtt';

app.use(json());

const corsOptions = {
  origin: 'localhost:5173', 
  optionsSuccessStatus: 200,
};

app.use(cors((corsOptions)));
// Configura la conexión a RabbitMQ
async function connect() {
  try {
    const connection = await _connect('amqp://34.231.183.98');
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME);
    // Configura el consumidor
    channel.consume(QUEUE_NAME, (msg) => {
      console.log ('bien');
      if (msg != null) {
        const message = msg.content.toString();
        console.log(message)
        const data = message.split('-');
        const movimiento = JSON.stringify({
          nombre: data[0],
          temperatura: data[2],
          humedad: data[1],
          hora: new Date().toLocaleTimeString(),
          fecha: `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`
        })
        console.log(movimiento)
        fetch('http://localhost:3004/movimiento/crear', {
          method: 'POST',
          headers: {  'Content-Type': 'application/json', "Accept": "application/json" },
          body: movimiento
        })
        console.log('Mensaje enviado a la API');
        io.emit('message');
        // Envía el mensaje al cliente React (frontend) a través de Socket.io
      }
    }, { noAck: false });
  } catch (error) {
    console.error('Error al conectar con RabbitMQ:', error.message);
  }
}
// Inicia la conexión con RabbitMQ al iniciar el servidor
connect();
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor Node.js en ejecución en el puerto ${PORT}.`);
});