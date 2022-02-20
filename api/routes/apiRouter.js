const express = require('express');
const router = express.Router()

// Mock API data
const data = [
    {
        id: '1',
        speed: 20,
        location: 'India',
        frequency: 2.4,
    },
    {
        id: '2',
        speed: 50,
        location: 'USA',
        frequency: 5,
    }
]

router.use(express.json())

// GET all user data
router.get('/users', (req, res) => {
    try {
        if (data.length === 0) {
            return res.status(404).json({
                data: null,
                error: 'Couldn\'t find any user' 
            });
        }
        return res.status(200).json({
            data: data,
            error: null 
        });
    } catch (err) {
        return res.status(500).json({
            data: null,
            error: err.message
        });
    }
});

// GET specific user data
router.get('/users/:id', (req, res) => {
    try {
        const result = data.filter(item => item.id === req.params.id);
        if (result.length === 0) {
            return res.status(404).json({
                data: null,
                error: 'Couldn\'t find user'
            })
        }
        return res.status(200).json({
            data: result[0],
            error: null
        }) 
    } catch (err) {
        return res.status(500).json({
            data: null,
            error: err.message
        }) 
    }
});

// GET paginated user data - 10 users per page
router.get('/users/pages/:id', (req, res) => {
    try {
        if (data.length === 0) {
            return res.status(404).json({
                data: null,
                error: 'Couldn\'t find any user'
            });
        }
        // Start and end index for page data
        const startIndex = (req.params.id - 1) * 10;
        const endIndex = req.params.id * 10 > data.length ? data.length : req.params.id * 10;

        if (startIndex > data.length || req.params.id < 1) {
            return res.status(404).json({
                data: null,
                error: 'Couldn\'t find page'
            });
        }
        const result = data.slice(startIndex, endIndex);
        return res.status(200).json({
            data: result,
            error: null
        });
    } catch (err) {
        return res.status(500).json({
            data: null,
            error: err.message
        });
    }
});

// POST user data
router.post('/users', (req, res) => {
    try {
        const user = {
            id: req.body.id,
            speed: req.body.speed,
            location: req.body.location,
            frequency: req.body.frequency
        };
        data.push(user);
        return res.status(201).json({
            data: {
                message: 'Data added successfully'
            },
            error: null
        });
    } catch (err) {
        return res.status(500).json({
            data: null,
            error: err.message
        });
    }
})

module.exports = router;