import React, { useState } from 'react';
import axios from 'axios';

const AddAnimal = () => {
    const [formData, setFormData] = useState({
        name: '',
        species: '',
        age: '',
        gender: ''
    });
    
    
    const [qrCode, setQrCode] = useState(null); 

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
           
            const res = await axios.post('https://pawtrack-backend.vercel.app/api/animals/add', formData);
            
            if (res.data.success) {
                alert("Animal Added Successfully!");
                
                setQrCode(res.data.data.qrCodeUrl); 
            }
        } catch (error) {
            console.error("Error adding animal:", error);
            alert("Failed to add animal.");
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', fontFamily: 'sans-serif' }}>
            <h2>Register New Animal</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                <label>Name: 
                    <input type="text" name="name" onChange={handleChange} required style={{ width: '100%', padding: '5px' }}/>
                </label>
                
                <label>Species: 
                    <input type="text" name="species" onChange={handleChange} required style={{ width: '100%', padding: '5px' }}/>
                </label>
                
                <label>Age: 
                    <input type="number" name="age" onChange={handleChange} style={{ width: '100%', padding: '5px' }}/>
                </label>
                
                <label>Gender: 
                    <select name="gender" onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </label>
                
                <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Add Animal
                </button>
            </form>

            {/* QR Code එක හැදුනට පස්සේ පෙන්වන තැන */}
            {qrCode && (
                <div style={{ marginTop: '30px', textAlign: 'center', border: '1px solid #ccc', padding: '15px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Generated QR Code</h3>
                    <img src={qrCode} alt="Animal QR Code" style={{ width: '150px', height: '150px' }} />
                    <p style={{ fontSize: '12px', color: '#666' }}>Scan to view animal details</p>
                </div>
            )}
        </div>
    );
};

export default AddAnimal;