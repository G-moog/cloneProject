const express = require('express');
const User = require('../models/userSchema');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authMiddlleware = require('../middlewares/auth-middleware');
require('dotenv').config();


const postUsersSchemas = Joi.object({
  user_id: Joi.string()
    .required()
    .pattern(new RegExp('^[a-zA-Z0-9가-힣]{4,16}$')),
  user_nick: Joi.string().required().min(4).max(10),
  user_pwd: Joi.string().required()
    .pattern(new RegExp('^[a-zA-Z0-9가-힣]{4,16}$')),
  confirmPassword: Joi.string().required()
    .pattern(new RegExp('^[a-zA-Z0-9가-힣]{4,16}$')),
});

// 회원가입구현
router.post('/signup', async (req, res) => {
  try {
    console.log(req.body);
    const { user_id, user_nick, user_pwd, confirmPassword } = await postUsersSchemas.validateAsync(req.body);
    if (user_pwd !== confirmPassword) {
      res.status(400).send({
        errorMessage: '비밀번호를 확인해주세요.',
      });
      return;
    }
    if (user_id === user_pwd) {
      res.status(400).send({
        errorMessage: '아이디와 비밀번호가 동일하면 안됩니다.',
      });
      return;
    }

    const existUsers = await User.find({ user_id });
    if (existUsers.length) {
      res.status(400).send({
        errorMessage: '이미 가입된 아이디입니다.',
      });
      return;
    }
    const user = new User({ user_id, user_pwd, user_nick, host_cert: false });
    await user.save();

    res.status(201).send({});
  } catch (err) {
    // console.log(err.details[0].message)
    // console.log(err);
    res.status(400).send({
      errorMessage: '요청한 형식이 올바르지 않습니다.', 
    });
  }
});

const postAuthSchemas = Joi.object({
  user_id: Joi.string()
    .required()
    .pattern(new RegExp('^[a-zA-Z0-9]{4,16}$')),
  user_pwd: Joi.string().min(4).max(16),
});

// 로그인 구현
router.post('/login', async (req, res) => {
    console.log(req.body);
  try {
    const { user_id, user_pwd } = await postAuthSchemas.validateAsync(req.body);
    // console.log("여기까진 오나?");
    const user = await User.findOne({ user_id }).exec();
    // console.log("검색은 하나??");
    console.log(user);
    if (!user) {
      res.status(400).send({
        errorMessage: '닉네임 또는 패스워드가 잘못됐습니다.',
      });
      return;
    }
    // console.log("1차 검증");
    // user.comparePassword(req.body.user_pwd, (err, isMatch) => {
    //   if (!isMatch) {
    //     return res.status(400).send({
    //       errorMessage: '닉네임 또는 패스워드가 잘못됐습니다.',
    //     });
    //   }
    // });
    // console.log("아디 비번은 맞고");
    
    const token = jwt.sign(
      { user_id: user.user_id ,user_nick: user.user_nick},
      process.env.JWT_SECRET
    );
    // console.log("토큰 내부값은?", token);
    res.send({
      token,
    });
  } catch (error) {
    // console.log(error);
    res.status(400).send({
      errorMessage: '요청한 형식이 올바르지 않습니다.',
    });
  }
});

// 사용자인증 미들웨어
router.get('/auth', authMiddlleware, async (req, res) => {
  const { user } = res.locals;
  res.send({
    user: {
      user_id: user.user_id,
      user_nick: user.user_nick
    },
  });
});

router.post('/signup/checkid', async (req, res) => {
  // console.log("아이디 중복체크 api시작");
  const input_id = req.body.user_id;
  // console.log("input_id값은  ", input_id);
  
  const existUsers = await User.find({ user_id: input_id });

  // console.log("existUser: ", existUsers[0].user_id);
  // console.log("existUser: ", existUsers);
  
  if (existUsers.length) {
      res.send({
        success: '이미 가입된 아이디입니다.',
      });
      return;
    }
    
    res.send({ 
      fail:"사용가능한 아이디입니다.", 
    });
  } 
);

router.post('/signup/checknick', async (req, res) => {
  // console.log("닉네임 중복체크 api시작");
  const input_nick = req.body.user_nick;
  // console.log("input_nick값은  ", input_nick);
  
  const existUsers = await User.find({ user_nick: input_nick });

  // console.log("existUser: ", existUsers[0].user_nick);
  // console.log("existUser: ", existUsers);
  
  if (existUsers.length) {
      res.send({
        success: '이미 사용중인 닉네임입니다.',
      });
      return;
    }
    
    res.send({ 
      fail:"사용가능한 닉네임입니다." 
    });
  } 
);


module.exports = router;