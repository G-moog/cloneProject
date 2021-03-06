const express = require('express');
const router = express.Router();
require('dotenv').config();
const Homes = require('../models/homeSchema');
const authmiddlewares = require('../middlewares/auth-middleware');
const Likes = require('../models/likeSchema'); // added

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}



//메인페이지 카테고리별 DB 공급
router.get("/homes", authmiddlewares, async (req, res) => {
  const received_categori = req.query.category; 
  
  const homes = await Homes.find({"category": received_categori}, {category: 1, address: 1, latitude: 1, longitude: 1, image_url: 1, price: 1, distance: 1, availableDate: 1}).exec();
  // const homes = await Homes.find({"category": received_categori}, {category: 1, address: 1, geolocation: 1, image_url: 1, price: 1, distance: 1, availableDate: 1}).exec();

  let isLike = new Array()

  if (res.locals.user){ // 로그인 정보가 있는 경우
    const { user } = res.locals;
    isLike = await Likes.find({user_id:user.user_id}).exec();
    
    homes.map((home) => {
      // isLike 배열에 들어있는 e.home_id 와 현재 map 연산 중인 home._id 를 비교하여 일치하는 경우
      if (isLike.filter(e => e.home_id === home.HomesId).length > 0){
        // isLike 배열에 들어있는 e.user_id와 로그인한 유저 user.user_id 가 일치하는 경우
        if (isLike.filter(e => e.user_id === user.user_id).length > 0){ 
          home._doc.isLike = true;
        }
      } else { // 비회원
        home._doc.isLike = false;
      }
    })
  } else { // 로그인 정보가 없는 경우. res.locals.user = '' 로 보내므로, 값이 없음.
    homes.map((home) => {
      home._doc.isLike = false; 
    })
  }

  res.send({ homes });  
});

// - 숙소ID `HomesId` String
// - 집 종류 `category` String
// - 숙소 주소 `address` String
// - 이미지URL `image_url[]` Array [String]
// - 1박당 비용 `price` Number
// - 내가 위치한 곳 기준 거리 `distance` Number
// - 숙박 가능 기간 `availableDate` String

router.get("/homes/:homes_id", authmiddlewares, async (req, res) => {
  const { homes_id }  = req.params;
  const user = res.locals.user;
  
  const homes = await Homes.findById(homes_id);
  // const homes = await Homes.find({"_id": homes_id}).exec();
  let isLike = new Array();
  if (user){
    isLike = await Likes.find({user_id:user.user_id}).exec();
    // homes._id.toHexString()
    
    if (isLike.filter(e => e.home_id === homes_id).length > 0){ // 일치하는게 있는 경우
      homes._doc.isLike = true;
    } else {
      homes._doc.isLike = false;
    }
  } else {
    homes._doc.isLike = false;
  }
  
  res.send({ homes });  
});


//숙소 등록
router.post('/hosting', async (req, res) => {
  
  // const { host_cert } = res.locals.user
  // console.log(host_cert);

  // if(host_cert === false) {
  //   res.send({
  //     fail: '호스트 권한이 없는 계정입니다.'
  //   });
  //   return;
  // } 
 
  const convenience = ['온수', '여분의 베개와 담요', 'TV', '유아용 식탁의자', '반려 동물 입실 가능', '주방', '기본 조리 도구', '식기류', '단층 주택', '자전거'];
  const distance = getRandomInt(1, 10000);
  const availableDate = "07월 1일 ~ 8일"
  const {home_name, category, address, image_url, introduce, price} = req.body;
  
  await Homes.create({home_name, category, address, image_url, introduce, price, convenience, distance, availableDate});
  
  res.send({
      success: '숙소 등록이 완료되었습니다.'
  });
});

module.exports = router;