const md5 = require('md5');
const mysql = require('mysql');
const conf = require('../config/config');

let db;
db = mysql.createConnection(conf.dbConfig);

setTimeout(() => {
    console.info('here...', conf.dbConfig);
    db.connect((err) => {
        if (err) {
            console.error('mysql db connection err=>', err);
        } else {
            db.query(`CREATE DATABASE IF NOT EXISTS ${conf.database};`, (err, resultsett) => {
                if (err) {
                    console.error(err);
                } else {
                    console.info('first query...');
                    db.query(`use ${conf.database};`, (err, resultset) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.info('Ok');
                            db.query('CREATE TABLE IF NOT EXISTS `users` (id int(11) unsigned NOT NULL AUTO_INCREMENT, email varchar(200) DEFAULT NULL, password varchar(32) DEFAULT NULL, createdDateTime datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id));', (err, resultset1) => {
                                if (err) {
                                    console.error(err);
                                } else {
                                    console.info(`Ok1`);
                                    const groups_sql = 'CREATE TABLE IF NOT EXISTS `groups` (id int(11) unsigned NOT NULL AUTO_INCREMENT, groupName varchar(100) DEFAULT NULL, createdDateTime datetime DEFAULT CURRENT_TIMESTAMP, createdUserId int(11) unsigned DEFAULT NULL,  isDeleted tinyint(1) DEFAULT \'0\', PRIMARY KEY (id), KEY fk_groups_user_id (createdUserId),  CONSTRAINT fk_groups_user_id FOREIGN KEY (createdUserId) REFERENCES `users` (id));'
                                    console.info(groups_sql);
                                    db.query(groups_sql, (err2, resultset2) => {
                                        if (err2) {
                                            console.error(err2);
                                        } else {
                                            console.info(`Ok2`);
                                            const sql3 = 'CREATE TABLE IF NOT EXISTS `todos` (id int(11) unsigned NOT NULL AUTO_INCREMENT, todo text, createdUserId int(11) unsigned DEFAULT NULL, status tinyint(11) DEFAULT \'0\', dueDate datetime DEFAULT NULL, groupId int(11) unsigned DEFAULT NULL, priority int(11) DEFAULT NULL,isDeleted tinyint(1) DEFAULT \'0\',createdDateTime datetime DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (id),KEY fk_todos_user_id (createdUserId),KEY fk_todos_group_id (groupId),CONSTRAINT fk_todos_group_id FOREIGN KEY (groupId) REFERENCES `groups` (id),CONSTRAINT fk_todos_user_id FOREIGN KEY (createdUserId) REFERENCES `users` (id));';
                                            db.query(sql3, (err3, resultset3) => {
                                                if (err3) {
                                                    console.error(err3);
                                                } else {
                                                    console.info(`Ok333`);
                                                }
                                            })
                                        }

                                    })
                                }
                            });
                        }
                    });
                }
            });

            console.info('mysql connected to db');
        }
    });
}, 1000);

const dbModels = {
    todos: new Set([ 'todo', 'groupId', 'status', 'dueDate', 'priority', 'isDeleted']),
    groups: new Set(['groupName', 'isDeleted'])
};



const checkEmail = (email: string):Promise<boolean> =>{
    return new Promise((resolve, reject) => {
        db.query('SELECT email FROM `users` WHERE email=?', [email.toLowerCase()], (err, dataset, fields) => {
           if (err) {
               reject(err);
           } else {
               resolve(!!!(dataset.length > 0))
           }
        });
    });
}

const checkEmailWithPassword = (email: string, password: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        const md5Pass = md5(password);
        console.info('here=>checkEmailWithPassword');
        db.query('SELECT email,id FROM `users` WHERE email=? AND password=?', [email.toLowerCase(), md5Pass], (err, dataset, fields) => {
            console.info('dataset=>', dataset);
            if (err) {
                reject(err);
            } else if (dataset.length > 0) {
                resolve(dataset[0].id);
            } else {
                resolve(0)
            }
        });
    });
}

const updateData = (tableName, dataId, updateData, userId) => {
    return new Promise((resolve, reject) => {
        console.info('here=>', dataId);
        console.info('updateData=>', updateData);
        if (dataId > 0 && updateData) {
            let sql = 'UPDATE `' + tableName + '` SET ';
            const values = [];
            let i = 0;
            for (const key of Object.keys(updateData)) {
                if (dbModels[tableName].has(key)) {
                    const val = key === 'dueDate' ? updateData[key].replace('T', ' ').substring(0, updateData[key].length - 5) : updateData[key];
                    sql += (i > 0 ? ',' : '') + `${key}=?`;
                    values.push(val);
                    i++;
                }
            }
            sql += ` WHERE id=? AND createdUserId=?`;
            values.push(dataId);
            values.push(userId);
            console.info('sql =>', sql);
            console.info('values=>', values);
            db.query(sql, values, (err, recordset) => {
                if (err) {
                    console.error(err);
                    resolve({status: false, error: true})
                } else {
                    resolve({status: true});
                }
            });
        } else {
            resolve({status: false});
        }
    });
}


const userController = (req) => {
    const jwt = require('jsonwebtoken');
    const login = (userId:number = 0) => {
        return new Promise(async (resolve, reject) => {
            const {email, password} = req.body;
            try {
                const uid = userId || await checkEmailWithPassword(email, password);
                console.info('uid=>', uid);
                if (uid > 0) {
                    const payLoad = {email, password, role: 'user', userId: uid};
                    const token = jwt.sign(payLoad, req.app.get("api_secret_key"), {expiresIn: 120000/*dk*/});
                    resolve({status: true, token, email});
                } else {
                    resolve({status: false, error: 'email address or password wrong'});
                }
            } catch (e) {
                console.error(e);
                reject({status: false, error: 'an error occured'});

            }
        });
    }
    const register = () => {
        return new Promise((resolve, reject) => {
            const {userData} = req.body;
            console.info('user data=>', userData);
            checkEmail(userData.email).then(checked => {
                if (checked) {
                    const md5Pass = md5(userData.password);
                    db.query('INSERT INTO `users` (email, password) VALUES(?, ?);', [userData.email, md5Pass], (err, resultset, fields) => {
                       if (err) {
                           console.error(err);
                           reject({status: false, error: 'an error occured'});
                       } else {
                           console.info('resultset=>', resultset);
                           db.query('SELECT MAX(id) as id from `users`;', (err, resultset2) => {
                               console.info('resultset=>', resultset2);
                              if (resultset2.length > 0) {
                                  resolve(login(resultset2[0].id));
                              } else {
                                  resolve(login())
                              }
                           });
                       }
                    });
                } else {
                    resolve({status: false, message: 'email already registered'});
                }
            }).catch(err => {
                resolve({status: false, error: true});
            })
        });
    }

    return{login, register};
}

const todoController = (userId: number | null) => {
    const getTodos = (filters) => {
        return new Promise((resolve, reject) => {
           if (userId > 0) {
               let sql = 'SELECT a.*, b.groupName FROM `todos` a LEFT JOIN `groups` b ON a.groupId=b.id WHERE a.createdUserId=? AND a.isDeleted=0';
               const values = [userId];
               console.info('filters=>', filters)
               if (filters) {
                   for (const key of Object.keys(filters)) {
                       sql += ` AND ${key}=?`;
                       values.push(filters[key]);
                   }
               }
               sql += ` ORDER BY dueDate`;
               console.info('sql=>', sql);
               db.query(sql, values, (err, recordset) => {
                   if (err) {
                       console.error(err);
                       reject({status: false, error: true})
                   } else {
                       resolve({status: true, data: recordset});
                   }
               });
           } else {
               resolve({status: false});
           }
        });
    }

    const insertTodo = (data) => {
        return new Promise(async (resolve, reject) => {
            const todoData = data.todoData || null;
            console.info('todo data=>', todoData);
            if (todoData) {
                let groupId = todoData.groupId;
                if (groupId === 0 && todoData.groupData) {
                    const group: any = await groupController(userId).insertGroup(todoData.groupData);
                 //   console.info('group=>', group);
                    if (group.status) {
                        groupId = group.groupId;
                    }
                }
                db.query('INSERT INTO `todos` (todo, createdUserId, groupId, dueDate, priority) VALUES (?, ?, ?, ?, ?)', [todoData.todo, userId, groupId, todoData.dueDate.replace('T', ' ').substring(0, todoData.dueDate.length - 5), todoData.priority], (err, resultset) => {
                    if(err) {
                        console.info(err);
                        resolve({status: false, error: true})
                    } else {
                        resolve({status: true});
                    }
                });
            } else {
                resolve({status: false});
            }

        })
    }

    const updateTodo = (updateTodoData: any | null) => {
        return new Promise(async (resolve, reject) => {
            if (updateTodoData.groupId === 0 && updateTodoData.groupData) {
                const newGroup: any = await groupController(userId).insertGroup(updateTodoData.groupData);
                if (newGroup.status) {
                    updateTodoData.groupId = newGroup.groupId;
                }
            }

            updateData('todos', updateTodoData.id, updateTodoData, userId).then(result => {
                resolve(result);
            });
        });
    }

    const setTodoStatus = (todoId: number, status: number) => {
        return new Promise(async (resolve, reject) => {
            if (todoId) {
                updateData('todos', todoId, {status}, userId).then(result => {
                    resolve(result);
                });
            } else {
                resolve({status: false});
            }

        });
    }


    const deleteTodo = (todoId: number) => {
        return new Promise((resolve, reject) => {
            if (todoId > 0) {
                db.query('UPDATE `todos` SET isDeleted=1 WHERE id=? AND createdUserId=?', [todoId, userId], (err, recordset) => {
                    if (err) {
                        console.error(err);
                        resolve({status: false, error: true})
                    } else {
                        resolve({status: true});
                    }
                });
            } else {
                resolve({status: false});
            }
        })
    }

    return{getTodos, insertTodo, updateTodo, deleteTodo, setTodoStatus};
}

const groupController = (userId) => {
    const getGroups = () => {
        return new Promise((resolve, reject) => {
            console.info('here=>>>>', userId);
            if (userId > 0) {
                db.query('SELECT id, groupName FROM `groups` WHERE createdUserId=? AND isDeleted=0 ', [userId], (err, resultset) => {
                    if(err) {
                        console.error(err);
                        resolve({status: false, error: true});
                    } else {
                        resolve({status: true, data: resultset});
                    }
                })
            } else {
                resolve({status: false, data: []});
            }
        });
    }

    const insertGroup = (groupData) => {
        return new Promise((resolve, reject) => {
            console.info('group data=>', groupData);
           if (userId > 0 && groupData) {
               db.query('INSERT INTO `groups` (groupName, createdUserId) VALUES (?, ?)', [groupData.groupName, userId], (err, resultset) => {
                   if(err) {
                       reject({status: false, error: true})
                   } else {
                       db.query('SELECT MAX(id) as id FROM `groups` WHERE createdUserId=?', [userId], (err, resultset2) => {
                           console.info('resultset2=>', resultset2);
                          if (err) {
                              reject({status: false, error: true})
                          } else {
                              resolve({status: true, groupId: resultset2[0].id});
                          }
                       });
                   }
               });
           } else {
               resolve({status: false});
           }
        });
    }

    const updateGroup = (updateGroupData: any | null) => {
        return new Promise((resolve, reject) => {
            updateData('groups', updateGroupData.id, updateGroupData, userId).then(result => {
                resolve(result);
            });
        });
    }

    const deleteGroup = (groupId: number) => {
        return new Promise((resolve, reject) => {
            console.info('delete group here=>', groupId);
            if (groupId > 0) {
                db.query('UPDATE `groups` SET isDeleted=1 WHERE id=? AND createdUserId=?', [groupId, userId], (err, recordset) => {
                    if (err) {
                        reject({status: false, error: true})
                    } else {
                        resolve({status: true});
                    }
                });
            } else {
                resolve({status: false});
            }
        })
    }
    return{getGroups, insertGroup, updateGroup, deleteGroup}
}

module.exports = {
    userController,
    todoController,
    groupController
}