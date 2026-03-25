import axios from 'axios';

const getAllComplaints = async() => {
    const response = await axios.get('http://localhost:3000/api/complaints/all');
    // console.log(response.data);
    return response.data;
}

export {getAllComplaints};