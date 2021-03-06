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
    .pattern(new RegExp('^[a-zA-Z0-9]{4,16}$')),
  user_nick: Joi.string().required().min(4).max(10),
  user_pwd: Joi.string().required()
    .pattern(new RegExp('^[a-zA-Z0-9]{4,16}$')),
  confirmPassword: Joi.string().required()
    .pattern(new RegExp('^[a-zA-Z0-9]{4,16}$')),
});

// 회원가입구현
router.post('/signup', async (req, res) => {
  try {
    const { user_id, user_nick, user_pwd, confirmPassword } = await postUsersSchemas.validateAsync(req.body);
    if (user_pwd !== confirmPassword) {
      res.send({
        fail: '비밀번호를 확인해주세요.',
      });
      return;
    }
    if (user_id === user_pwd) {
      res.send({
        fail: '아이디와 비밀번호가 동일하면 안됩니다.',
      });
      return;
    }

    const existUsers = await User.find({ user_id });
    if (existUsers.length) {
      res.send({
        fail: '이미 가입된 아이디입니다.',
      });
      return;
    }
    const user = new User({ user_id, user_pwd, user_nick, host_cert: false });
    await user.save();

    res.send({
      success: "회원가입이 완료되었습니다."
    });
  } catch (err) {    
    res.send({
      fail: '요청한 형식이 올바르지 않습니다.',
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
  try {
    const { user_id, user_pwd } = await postAuthSchemas.validateAsync(req.body);
    const user = await User.findOne({ user_id, user_pwd }).exec();
    if (!user) {
      res.send({
        result: false,
        msg: '아이디 또는 비밀번호를 확인해주세요.',
      });
      return;
    }
    
    const token = jwt.sign(
      { user_id: user.user_id, user_nick: user.user_nick },
      process.env.JWT_SECRET
    );
    
    res.send({
      result: true,
      msg: "로그인에 성공했습니다.",
      token,
      user: {
        user_id: user.user_id,
        user_nick: user.user_nick
    }});
  } catch (error) {    
    res.send({
      result: false,
      msg: '아이디 또는 비밀번호를 확인해주세요.',
    });
  }
});

// 사용자인증 미들웨어
router.get('/auth', authMiddlleware, async (req, res) => {
  const { user } = res.locals;
  if (user) {
    res.send({
      success: "success",

      user: {
        user_id: user.user_id,
        user_nick: user.user_nick

      }
    })
  } else{
    res.send({
      fail: "로그인후 이용하세요",
    })
  }



});

router.post('/signup/checkid', async (req, res) => {  
  const input_id = req.body.user_id;
  const existUsers = await User.find({ user_id: input_id });
  
  if (existUsers.length) {
    res.send({
      msg: '이미 가입된 아이디입니다.',
    });
    return;
  }

  res.send({
    msg: "사용가능한 아이디입니다.",
  });
}
);

router.post('/signup/checknick', async (req, res) => {  
  const input_nick = req.body.user_nick;
  const existUsers = await User.find({ user_nick: input_nick });
  
  if (existUsers.length) {
    res.send({
      msg: '이미 사용중인 닉네임입니다.',
    });
    return;
  }

  res.send({
    msg: "사용가능한 닉네임입니다."
  });
}
);


module.exports = router;