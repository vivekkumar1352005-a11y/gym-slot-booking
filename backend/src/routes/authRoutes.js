import { Router } from "express";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/me', authenticate, getMe);