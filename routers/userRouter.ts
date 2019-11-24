const router = require('express-promise-router')();
const userController = require('../controllers/userController');
import authMiddleware from '../middlewares/auth';

router.get('/', authMiddleware, userController.getUser);
router.put('/', userController.signUpUser);
router.post('/login', userController.loginUser);
router.get('/checkIfUsernameExist/:username', userController.checkIfUsernameExist);
router.get('/checkIfEmailExist/:email', userController.checkIfEmailExist);

export default router;
