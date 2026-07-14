// ============================================================
// Indic Monopoly - Board/state data (events, cities, colors)
// Pure data module, no side effects.
// ============================================================
var BOARDS=[
  {id:'rajasthan',name:'Rajasthan',capital:'Jaipur',
   events:[
    {icon:'&#127914;',text:'You attend Teej Festival! You get a 500RS for Teej Bonus!',amount:500,gain:true},
    {icon:'&#128024;',text:'You go to Gangaur Savari. You pay 100RS.',amount:-100,gain:false},
    {icon:'&#127979;',text:'Make donation for Poor. You pay 30RS.',amount:-30,gain:false},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#128176;',text:'You got a jackpot 500RS!',amount:500,gain:true},
    {icon:'&#128176;',text:'You got a jackpot 1000RS!',amount:1000,gain:true}
   ],
   colors:{red:['Jaipur','Jodhpur','Udaipur'],blue:['Bikaner','Ajmer','Alwar'],green:['Kota','Sikar','Pali'],pink:['Bharatpur','Chittorgarh','Jaisalmer'],yellow:['Barmer','Nagaur','Tonk'],orange:['Sawai Madhopur','Jhalawar','Hanumangarh'],brown:['Churu','Dholpur','Karauli'],white:['Dungarpur','Baran','Jhunjhunu'],purple:['Sri Ganganagar','Dausa','Bundi'],stations:['Jaipur Airport','Jodhpur Station','Bikaner Station','Udaipur Airport']}
  },
  {id:'gujarat',name:'Gujarat',capital:'Gandhinagar',
   events:[
    {icon:'&#129825;',text:'Uttarayan Kite Festival! You win the kite battle! +500RS',amount:500,gain:true},
    {icon:'&#127917;',text:'Navratri Garba night! Costume expenses. You pay 80RS.',amount:-80,gain:false},
    {icon:'&#129443;',text:'Gir Lion Safari! Ticket costs. You pay 100RS.',amount:-100,gain:false},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#128296;',text:'Diamond business bonus from Surat! +1000RS',amount:1000,gain:true},
    {icon:'&#128176;',text:'Rann Utsav Bonus! You got 500RS.',amount:500,gain:true}
   ],
   colors:{red:['Ahmedabad','Surat','Vadodara'],blue:['Rajkot','Bhavnagar','Jamnagar'],green:['Gandhinagar','Anand','Junagadh'],pink:['Morbi','Mehsana','Kutch'],yellow:['Navsari','Valsad','Surendranagar'],orange:['Amreli','Patan','Botad'],brown:['Dahod','Narmada','Tapi'],white:['Kheda','Banaskantha','Panchmahals'],purple:['Aravalli','Chhota Udaipur','Devbhumi Dwarka'],stations:['Ahmedabad Airport','Surat Station','Rajkot Airport','Vadodara Station']}
  },
  {id:'maharashtra',name:'Maharashtra',capital:'Mumbai',
   events:[
    {icon:'&#128024;',text:'Ganesh Chaturthi celebrations! Make donation 80RS.',amount:-80,gain:false},
    {icon:'&#127914;',text:'Lavani performance earnings! You get 500RS.',amount:500,gain:true},
    {icon:'&#9968;',text:'Trekking at Sahyadri! You pay 100RS expenses.',amount:-100,gain:false},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#127916;',text:'Bollywood jackpot! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#128176;',text:'Nashik Grape Festival bonus! You get 500RS.',amount:500,gain:true}
   ],
   colors:{red:['Mumbai','Pune','Nagpur'],blue:['Nashik','Aurangabad','Solapur'],green:['Thane','Kolhapur','Nanded'],pink:['Sangli','Satara','Ratnagiri'],yellow:['Akola','Latur','Amravati'],orange:['Jalgaon','Dhule','Ahmednagar'],brown:['Osmanabad','Parbhani','Buldhana'],white:['Beed','Washim','Yavatmal'],purple:['Nandurbar','Chandrapur','Gondia'],stations:['Mumbai Airport','Pune Airport','Nagpur Airport','Nashik Station']}
  },
  {id:'kerala',name:'Kerala',capital:'Thiruvananthapuram',
   events:[
    {icon:'&#128013;',text:'Onam Snake Boat Race winning bonus! You get 500RS.',amount:500,gain:true},
    {icon:'&#127796;',text:'Theyyam performance expenses. You pay 80RS.',amount:-80,gain:false},
    {icon:'&#128024;',text:'Thrissur Pooram elephant procession costs. You pay 100RS.',amount:-100,gain:false},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#129371;',text:'Spice trade jackpot from Idukki! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#127754;',text:'Houseboat tourism bonus! You get 500RS.',amount:500,gain:true}
   ],
   colors:{red:['Thiruvananthapuram','Kochi','Kozhikode'],blue:['Thrissur','Kollam','Kannur'],green:['Alappuzha','Palakkad','Malappuram'],pink:['Kottayam','Idukki','Wayanad'],yellow:['Pathanamthitta','Kasaragod','Ernakulam'],orange:['Varkala','Munnar','Thekkady'],brown:['Guruvayur','Periyar','Bekal'],white:['Lakshadweep','Ponnani','Chavakkad'],purple:['Ottapalam','Shoranur','Thalassery'],stations:['Kochi Airport','TVM Airport','Calicut Airport','Thrissur Station']}
  },
  {id:'punjab',name:'Punjab',capital:'Chandigarh',
   events:[
    {icon:'&#127806;',text:'Baisakhi harvest festival farm bonus! You get 500RS.',amount:500,gain:true},
    {icon:'&#127930;',text:'Bhangra competition travel expenses. You pay 80RS.',amount:-80,gain:false},
    {icon:'&#127939;',text:'Kabaddi tournament entry fee. You pay 100RS.',amount:-100,gain:false},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#128176;',text:'NRI relative sent money jackpot! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#127801;',text:'Rose Garden festival bonus! You get 500RS.',amount:500,gain:true}
   ],
   colors:{red:['Amritsar','Ludhiana','Chandigarh'],blue:['Jalandhar','Patiala','Bathinda'],green:['Mohali','Hoshiarpur','Gurdaspur'],pink:['Firozpur','Moga','Sangrur'],yellow:['Fazilka','Faridkot','Mansa'],orange:['Muktsar','Nawanshahr','Rupnagar'],brown:['Kapurthala','Fatehgarh Sahib','Tarn Taran'],white:['Barnala','Pathankot','Malerkotla'],purple:['SAS Nagar','Ferozepur','Ajitgarh'],stations:['Amritsar Airport','Chandigarh Airport','Ludhiana Station','Jalandhar Station']}
  },
  {id:'madhya_pradesh',name:'Madhya Pradesh',capital:'Bhopal',
   events:[
    {icon:'&#128047;',text:'Tiger Safari at Bandhavgarh! You get 500RS bonus.',amount:500,gain:true},
    {icon:'&#127917;',text:'Lokrang festival expenses. You pay 80RS.',amount:-80,gain:false},
    {icon:'&#9961;',text:'Mahakumbh pilgrimage travel costs. You pay 100RS.',amount:-100,gain:false},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#128176;',text:'Diamond mining jackpot from Panna! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#127802;',text:'Khajuraho Festival of Dances bonus! You get 500RS.',amount:500,gain:true}
   ],
   colors:{red:['Bhopal','Indore','Jabalpur'],blue:['Gwalior','Ujjain','Sagar'],green:['Dewas','Satna','Ratlam'],pink:['Rewa','Murwara','Singrauli'],yellow:['Burhanpur','Khandwa','Chhindwara'],orange:['Pithampur','Sehore','Vidisha'],brown:['Mandla','Balaghat','Dindori'],white:['Shivpuri','Morena','Guna'],purple:['Tikamgarh','Chhatarpur','Panna'],stations:['Bhopal Airport','Indore Airport','Jabalpur Station','Gwalior Station']}
  },
  {id:'west_bengal',name:'West Bengal',capital:'Kolkata',
   events:[
    {icon:'&#127912;',text:'Durga Puja pandal art prize! You get 500RS.',amount:500,gain:true},
    {icon:'&#127917;',text:'Rabindra Jayanti program expenses. You pay 80RS.',amount:-80,gain:false},
    {icon:'&#128032;',text:'Sundarbans boat tour ticket costs. You pay 100RS.',amount:-100,gain:false},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#128218;',text:'Kolkata Book Fair prize money! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#127800;',text:'Poila Baishakh New Year bonus! You get 500RS.',amount:500,gain:true}
   ],
   colors:{red:['Kolkata','Howrah','Siliguri'],blue:['Asansol','Durgapur','Bardhaman'],green:['Malda','Baharampur','Kharagpur'],pink:['Haldia','Bankura','Purulia'],yellow:['Cooch Behar','Jalpaiguri','Darjeeling'],orange:['Alipurduar','Kalimpong','Raiganj'],brown:['Krishnanagar','Nabadwip','Santiniketan'],white:['Barasat','Barrackpore','Kalyani'],purple:['Shantipur','Balurghat','Ranaghat'],stations:['Kolkata Airport','Bagdogra Airport','Howrah Station','Sealdah Station']}
  },
  {id:'tamil_nadu',name:'Tamil Nadu',capital:'Chennai',
   events:[
    {icon:'&#127749;',text:'Pongal festival sugarcane harvest bonus! You get 500RS.',amount:500,gain:true},
    {icon:'&#128698;',text:'Jallikattu participation expenses. You pay 80RS.',amount:-80,gain:false},
    {icon:'&#127754;',text:'Marina Beach storm damage! You pay 100RS.',amount:-100,gain:false},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#127916;',text:'Kollywood film royalty jackpot! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#127930;',text:'Chithirai Festival float prize! You get 500RS.',amount:500,gain:true}
   ],
   colors:{red:['Chennai','Coimbatore','Madurai'],blue:['Tiruchirappalli','Salem','Erode'],green:['Tirunelveli','Vellore','Thoothukudi'],pink:['Tiruppur','Dindigul','Thanjavur'],yellow:['Ranipet','Sivakasi','Karur'],orange:['Udhagamandalam','Hosur','Nagercoil'],brown:['Kumbakonam','Kancheepuram','Chidambaram'],white:['Rameswaram','Mahabalipuram','Kanyakumari'],purple:['Pollachi','Mettur','Cuddalore'],stations:['Chennai Airport','Coimbatore Airport','Madurai Airport','Tiruchirappalli Airport']}
  }
  ,{id:'uttarakhand',name:'Uttarakhand',capital:'Dehradun',
   events:[
    {icon:'&#127956;',text:'Char Dham Yatra bonus! Pilgrims brought prosperity. You get 500RS.',amount:500,gain:true},
    {icon:'&#127958;',text:'Kedarnath trek expenses. You pay 100RS.',amount:-100,gain:false},
    {icon:'&#127807;',text:'Phool Dei festival flower collection bonus! You get 300RS.',amount:300,gain:true},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#128176;',text:'Rishikesh rafting tourism jackpot! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#129496;',text:'Yoga retreat at Haridwar expenses. You pay 80RS.',amount:-80,gain:false}
   ],
   colors:{red:['Dehradun','Haridwar','Rishikesh'],blue:['Nainital','Mussoorie','Roorkee'],green:['Haldwani','Rudrapur','Kashipur'],pink:['Almora','Pithoragarh','Champawat'],yellow:['Bageshwar','Chamoli','Rudraprayag'],orange:['Uttarkashi','Tehri','Pauri'],brown:['Gopeshwar','Srinagar','Lansdowne'],white:['Kotdwar','Ramnagar','Jaspur'],purple:['Chakrata','Vikasnagar','Doiwala'],stations:['Jolly Grant Airport','Haridwar Station','Dehradun Station','Kathgodam Station']}
  },
  {id:'uttar_pradesh',name:'Uttar Pradesh',capital:'Lucknow',
   events:[
    {icon:'&#127956;',text:'Kumbh Mela pilgrimage bonus at Prayagraj! You get 500RS.',amount:500,gain:true},
    {icon:'&#127775;',text:'Taj Mahal tourism earnings! You get 300RS.',amount:300,gain:true},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#127979;',text:'Make donation at Kashi Vishwanath Temple. You pay 30RS.',amount:-30,gain:false},
    {icon:'&#128176;',text:'Lucknow Chikan embroidery business jackpot! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#127939;',text:'Kabaddi tournament entry fee. You pay 80RS.',amount:-80,gain:false}
   ],
   colors:{red:['Lucknow','Kanpur','Agra'],blue:['Varanasi','Prayagraj','Ghaziabad'],green:['Noida','Meerut','Bareilly'],pink:['Aligarh','Moradabad','Saharanpur'],yellow:['Gorakhpur','Firozabad','Mathura'],orange:['Muzaffarnagar','Rampur','Shahjahanpur'],brown:['Farrukhabad','Maunath Bhanjan','Hapur'],white:['Etawah','Mirzapur','Bulandshahr'],purple:['Jhansi','Orai','Banda'],stations:['Lucknow Airport','Agra Airport','Varanasi Airport','Prayagraj Station']}
  },
  {id:'chhattisgarh',name:'Chhattisgarh',capital:'Raipur',
   events:[
    {icon:'&#128139;',text:'Bastar Dussehra tribal festival bonus! You get 500RS.',amount:500,gain:true},
    {icon:'&#127807;',text:'Chitrakote waterfall tourism earnings! You get 300RS.',amount:300,gain:true},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#9973;',text:'Iron ore mining jackpot from Bailadila! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#127979;',text:'Make donation at Rajim Kumbh. You pay 30RS.',amount:-30,gain:false},
    {icon:'&#127958;',text:'Jungle safari at Kanha expenses. You pay 100RS.',amount:-100,gain:false}
   ],
   colors:{red:['Raipur','Bhilai','Durg'],blue:['Bilaspur','Korba','Rajnandgaon'],green:['Jagdalpur','Raigarh','Ambikapur'],pink:['Dhamtari','Mahasamund','Kanker'],yellow:['Kondagaon','Narayanpur','Bijapur'],orange:['Sukma','Dantewada','Bemetara'],brown:['Mungeli','Baloda Bazar','Gariaband'],white:['Janjgir','Balrampur','Surajpur'],purple:['Korea','Kabirdham','Gaurela'],stations:['Raipur Airport','Bilaspur Station','Durg Station','Jagdalpur Station']}
  },
  {id:'haryana',name:'Haryana',capital:'Chandigarh',
   events:[
    {icon:'&#127806;',text:'Baisakhi harvest celebration bonus! You get 500RS.',amount:500,gain:true},
    {icon:'&#129354;',text:'Surajkund Mela crafts fair earnings! You get 300RS.',amount:300,gain:true},
    {icon:'&#127881;',text:'Today is your birthday and each player pay you 10RS.',amount:10,gain:true,bday:true},
    {icon:'&#128176;',text:'Maruti Suzuki factory investment jackpot! You get 1000RS.',amount:1000,gain:true},
    {icon:'&#127939;',text:'Wrestling dangal entry fee. You pay 80RS.',amount:-80,gain:false},
    {icon:'&#127979;',text:'Make donation at Kurukshetra. You pay 30RS.',amount:-30,gain:false}
   ],
   colors:{red:['Gurugram','Faridabad','Panipat'],blue:['Ambala','Yamunanagar','Rohtak'],green:['Hisar','Karnal','Sonipat'],pink:['Panchkula','Bhiwani','Sirsa'],yellow:['Fatehabad','Jhajjar','Rewari'],orange:['Mahendragarh','Nuh','Palwal'],brown:['Kaithal','Kurukshetra','Jind'],white:['Pehowa','Narnaul','Hansi'],purple:['Ballabhgarh','Bahadurgarh','Gohana'],stations:['Chandigarh Airport','Hisar Airport','Ambala Station','Gurugram Station']}
  }
];
