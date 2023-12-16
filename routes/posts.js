var express = require('express');
var router = express.Router();
const multer = require('multer');
const mysql = require('mysql');

//import database
var connection = require('../config/database');

//konfigurasi multer untuk menyimpan file yang diunggah
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });

const upload = multer({ storage });

//untuk menampilkan halaman awal
router.get('/', function (req, res, next) {
    //view posts index
    res.render('posts/index');
});

//untuk menampilkan daftar soal ujian yang tersimpan dalam bank soal
router.get('/listsoal', function (req, res, next) {
    connection.query('SELECT * FROM banksoal ORDER BY id desc', function (err, rows) {
        if (err) {
            req.flash('error', err);
            res.render('posts', {
                data: ''
            });
        } else {
            res.render('posts/listsoal', {
                data: rows
            });
        }
    });
});

//menampilkan halaman menu untuk generate soal ujian otomatis
router.get('/rangkai', function (req, res, next) {
    res.render('posts/rangkai');
});

//untuk melakukan otomatisasi pemilihan soal ujian berdasarkan level kesulitan
router.get('/kesulitan', function (req, res, next) {
    connection.query("SELECT * FROM (SELECT * FROM `banksoal` WHERE level_diff = 'Easy' ORDER BY RAND() LIMIT 7) AS easy UNION ALL SELECT * FROM (SELECT * FROM `banksoal` WHERE level_diff = 'Medium' ORDER BY RAND() LIMIT 8) AS medium UNION ALL SELECT * FROM (SELECT * FROM `banksoal` WHERE level_diff = 'Hard' ORDER BY RAND() LIMIT 5) AS hard", function (err, rows) {
        if (err) {
            req.flash('error', err);
            res.render('posts', {
                data: ''
            });
        } else {
            res.render('posts/kesulitan', {
                data: rows
            });
        }
    });
});

//untuk melakukan otomatisasi pemilihan soal ujian berdasarkan bab materi
router.get('/materi', function (req, res, next) {
    connection.query("SELECT * FROM (SELECT * FROM `banksoal` WHERE bab = 'Bab 1 - User & Visual Requirements' ORDER BY RAND() LIMIT 5) AS bab1 UNION ALL SELECT * FROM (SELECT * FROM `banksoal` WHERE bab = 'Bab 2 - DFD & Use Case Diagram' ORDER BY RAND() LIMIT 2) AS bab2 UNION ALL SELECT * FROM (SELECT * FROM `banksoal` WHERE bab = 'Bab 3 - Risk Management in Software Project' ORDER BY RAND() LIMIT 4) AS bab3 UNION ALL SELECT * FROM (SELECT * FROM `banksoal` WHERE bab = 'Bab 4 - Process Modeling and Process Improvement' ORDER BY RAND() LIMIT 5) AS bab4 UNION ALL SELECT * FROM (SELECT * FROM `banksoal` WHERE bab = 'Bab 5 - Service Oriented Architecture (SOA)' ORDER BY RAND() LIMIT 4) AS bab5", function (err, rows) {
        if (err) {
            req.flash('error', err);
            res.render('posts', {
                data: ''
            });
        } else {
            res.render('posts/materi', {
                data: rows
            });
        }
    });
});

//untuk menampilkan daftar jadwal ujian yang telah tersimpan dalam database
router.get('/ujian', function (req, res, next) {
    connection.query('SELECT * FROM ujian ORDER BY id desc', function (err, rows) {
        if (err) {
            req.flash('error', err);
            res.render('posts/ujian', {
                data: ''
            });
        } else {
            //view posts listujian
            res.render('posts/listujian', {
                data: rows
            });
        }
    });
});

//untuk membuat jadwal ujian baru
router.get('/buatujian', function (req, res, next) {
    res.render('posts/createujian', {
        topic: '',
        exam_date: '',
        exam_file: ''
    })
})

// untuk menghandle file soal ujian yang diunggah
router.post('/coba', upload.single('exam_file'), async (req, res, next) => {
    try {
      let errors = false;
      let file = req.file;
  
      if (!file) {
        errors = true;
        req.flash('error', 'Berkas tidak boleh kosong!');
      }
  
      let topic = req.body.topic;
      let exam_date = req.body.exam_date;
  
      if (!errors) {
        let formData = {
          topic: topic,
          exam_date: exam_date,
          exam: file.filename,
        };
  
        await connection.query('INSERT INTO ujian SET ?', formData);
        req.flash('success', 'Data Berhasil Disimpan!');
        res.redirect('/posts/ujian');
      } else {
        res.render('posts/createujian', {
          topic: topic,
          exam_date: exam_date,
          errors: errors,
        });
      }
    } catch (error) {
      console.error(error);
      req.flash('error', 'Terjadi kesalahan!');
      res.redirect('/posts/createujian');
    }
});

//untuk menyimpan penjadwalan ujian yang baru ditambahkan ke dalam database
router.post('/simpan', function (req, res, next) {
    let topic   = req.body.topic;
    let exam_date = req.body.exam_date;
    let exam_file = req.body.exam_file;
    let errors  = false;

    if(!errors) {
        let formData = {
            topic: topic,
            exam_date: exam_date,
            exam_file: exam_file
        }
        connection.query('INSERT INTO ujian SET ?', formData, function(err, result) {
            if (err) {
                req.flash('error', err)
                res.render('posts/createujian', {
                    topic: formData.topic,
                    exam_date: formData.exam_date,                    
                    exam_file: formData.exam_file                                       
                })
            } else {                
                req.flash('success', 'Data Berhasil Disimpan!');
                res.redirect('/posts/ujian');
            }
        })
    }

})

module.exports = router;