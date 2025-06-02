// Script to add admin user directly to Firebase
// Run this in browser console on any page that has Firebase loaded

async function addAdminUser() {
    try {
        // Import Firebase functions
        const { createUserWithEmailAndPassword, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Import Firebase config (adjust path if needed)
        const { auth, db } = await import('./js/firebase-config.js');
        
        const adminData = {
            email: 'programmerom2006@gmail.com',
            password: 'admin123456', // Change this to a secure password
            fullname: 'Admin User',
            role: 'admin'
        };
        
        console.log('Creating admin user...');
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            adminData.email, 
            adminData.password
        );
        
        const user = userCredential.user;
        console.log('User created in Auth:', user.uid);
        
        // Add user to admin collection
        await setDoc(doc(db, 'adminUsers', user.uid), {
            uid: user.uid,
            firstName: 'Admin',
            lastName: 'User',
            email: adminData.email,
            phone: '',
            role: 'admin',
            businessName: 'Farmers Web Admin',
            businessType: 'platform',
            description: 'System Administrator',
            status: 'active',
            permissions: [
                'create_product', 'read_product', 'update_product', 'delete_product',
                'create_order', 'read_order', 'update_order', 'delete_order',
                'create_user', 'read_user', 'update_user', 'delete_user',
                'read_analytics', 'manage_settings', 'manage_roles'
            ],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: null,
            isActive: true
        });
        
        console.log('User added to admin collection');
        
        // Sign out the newly created user
        await signOut(auth);
        console.log('User signed out');
        
        console.log('✅ Admin user created successfully!');
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);
        console.log('Role:', adminData.role);
        
        return {
            success: true,
            message: 'Admin user created successfully',
            credentials: {
                email: adminData.email,
                password: adminData.password
            }
        };
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            console.log('User already exists in Auth, trying to add to admin collection...');
            
            try {
                // If user exists in auth, just add to admin collection
                const { signInWithEmailAndPassword, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const { auth, db } = await import('./js/firebase-config.js');
                
                // Sign in to get the user
                const userCredential = await signInWithEmailAndPassword(auth, adminData.email, adminData.password);
                const user = userCredential.user;
                
                // Add to admin collection
                await setDoc(doc(db, 'adminUsers', user.uid), {
                    uid: user.uid,
                    firstName: 'Admin',
                    lastName: 'User',
                    email: adminData.email,
                    phone: '',
                    role: 'admin',
                    businessName: 'Farmers Web Admin',
                    businessType: 'platform',
                    description: 'System Administrator',
                    status: 'active',
                    permissions: [
                        'create_product', 'read_product', 'update_product', 'delete_product',
                        'create_order', 'read_order', 'update_order', 'delete_order',
                        'create_user', 'read_user', 'update_user', 'delete_user',
                        'read_analytics', 'manage_settings', 'manage_roles'
                    ],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastLogin: null,
                    isActive: true
                });
                
                await signOut(auth);
                
                console.log('✅ User added to admin collection successfully!');
                return {
                    success: true,
                    message: 'User added to admin collection successfully'
                };
                
            } catch (innerError) {
                console.error('❌ Error adding existing user to admin collection:', innerError);
                return {
                    success: false,
                    error: innerError.message
                };
            }
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the function
addAdminUser().then(result => {
    if (result.success) {
        alert('Admin user created successfully! Check console for details.');
    } else {
        alert('Failed to create admin user: ' + result.error);
    }
});

// Also make it available globally
window.addAdminUser = addAdminUser;