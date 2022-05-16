const express = require('express');
const bodyParser = require('body-parser');
require("dotenv").config();


const config = require('../config/config');
const middleware = require('./middleware');
const controller = require('./controller');
const app = express();

const PORT = process.env.NODE_LOCAL_PORT || process.env.NODE_DOCKER_PORT ||  3555;

app.set("api_secret_key", config.api_secret_key);
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader("Access-Control-Allow-Headers", 'X-Requested-With ,Content-Type, Authorization, Content-Length');
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use(middleware);

app.post('/login', (req: any, res: any) => {
    console.info('heree=>', req.body);
    controller.userController(req).login().then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});
app.post('/register', (req: any, res: any) => {
    console.info('heree=>', req.body);
    controller.userController(req).register().then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});

app.get('/getTodos', (req: any, res: any) => {
    controller.todoController(req.user.userId).getTodos(req.query).then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });
});

app.post('/addTodo', (req: any, res: any) => {
    controller.todoController(req.user.userId).insertTodo(req.body).then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});

app.put('/updateTodo', (req: any, res: any) => {
    const {updateData} = req.body;
    controller.todoController(req.user.userId).updateTodo(updateData).then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});
app.put('/setTodoStatus', (req: any, res: any) => {
    const {todoId, status} = req.body;
    controller.todoController(req.user.userId).setTodoStatus(todoId, status).then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});

app.delete('/deleteTodo', (req: any, res: any) => {
    const {todoId} = req.body;
    console.info('todo id=>', todoId)
    controller.todoController(req.user.userId).deleteTodo(todoId).then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});

app.get('/getGroups', (req: any, res: any) => {
    controller.groupController(req.user.userId).getGroups(req.query).then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});

app.post('/addGroup', (req: any, res: any) => {
    const {groupData} = req.body;
    controller.groupController(req.user.userId).insertGroup(groupData).then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});

app.put('/updateGroup', (req: any, res: any) => {
    const {updateData} = req.body;
    controller.groupController(req.user.userId).updateGroup(updateData).then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});

app.delete('/deleteGroup', (req: any, res: any) => {
    const {groupId} = req.body;
    controller.groupController(req.user.userId).deleteGroup(groupId).then(result => {
        res.status(200).send(result);
    }).catch((err) => {
        res.status(500).send({status: false, errorMessage: 'internal server error'});
    });;
});


app.listen(PORT, () => {
    console.log(PORT + " Port listening ...");
});