import { View, Text } from 'react-native'
import { useAuthStore } from '../store/authStore'
import {Image} from "expo-image";
import styles from '../assets/styles/profile.styles';
import {formatMemberSince} from "../lib/utils";

const ProfileHeader = () => {
    const {user} = useAuthStore();

    if(!user) return null;
    
  return (
    <View style={styles.profileHeader}>
      <Image source={{uri: user.profileImage}} style={styles.profileImage}/>

      <View style={styles.profileInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
    </View>
  )
}

export default ProfileHeader