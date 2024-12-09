const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3000;

// Dados em memória
let users = [];
let messages = [];

// Adicionando o usuário "admin" com e-mail "admin" se não existir
const adminExists = users.some(user => user.email === "admin");
if (!adminExists) {
    users.push({ name: "Admin", email: "admin@gmail.com", password: "123" });
}

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());  // Middleware de cookies
app.use(session({ secret: "seu-segredo", resave: false, saveUninitialized: false }));
app.use(express.static(path.join(__dirname, "public")));

// Middleware para registrar o último acesso no cookie
app.use((req, res, next) => {
    if (req.session.user) {
        // Registra o último acesso no cookie
        const lastAccess = new Date().toLocaleString();
        res.cookie('lastAccess', lastAccess, { maxAge: 900000, httpOnly: true });
        req.lastAccess = lastAccess;
    }
    next();
});

// Rota para registrar um novo usuário
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).send("Todos os campos são obrigatórios!");
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).send("Email já cadastrado!");
    }
    users.push({ name, email, password });
    res.redirect("/");
});

// Rota de login
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).send("Credenciais inválidas!");
    }

    req.session.user = user;
    res.redirect("/chat.html");
});

// Rota para enviar uma mensagem
app.post("/send-message", (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Você não está autenticado!");
    }
    const { message, userEmail } = req.body;
    if (!message || !userEmail) {
        return res.status(400).send("Mensagem ou usuário não podem estar vazios!");
    }

    const user = users.find(u => u.email === userEmail);
    if (!user) {
        return res.status(400).send("Usuário não encontrado!");
    }

    messages.push({ user: user.name, message, timestamp: new Date() });
    res.redirect("/chat.html"); // Redireciona para a página de chat após enviar a mensagem
});

// Rota para obter as mensagens
app.get("/messages", (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Você não está autenticado!");
    }
    res.json(messages);
});

// Rota para pegar os usuários cadastrados
app.get("/users", (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Você não está autenticado!");
    }
    res.json(users);
});

// Rota de logout
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Erro ao sair");
        }
        res.redirect("/index.html"); // Redireciona para a página de login
    });
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
