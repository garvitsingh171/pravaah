// Loaded exclusively by the fictional localhost preview configuration.
const getToken = async () => 'fictional-preview';
export const useAuth = () => ({ isLoaded: true, isSignedIn: true, getToken });
export const useClerk = () => ({
    signOut: async () => {
        throw new Error('Preview only');
    },
});
export const ClerkProvider = ({ children }) => children;
export const SignIn = () => null;
export const SignUp = () => null;
