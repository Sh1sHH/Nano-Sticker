import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/App';
import { useAppStore } from '@/stores/appStore';
import PhotoSelectionComponent from '@/components/PhotoSelectionComponent';

type PhotoSelectionScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'PhotoSelection'
>;

interface Props {
    navigation: PhotoSelectionScreenNavigationProp;
}

const PhotoSelectionScreen: React.FC<Props> = ({ navigation }) => {
    const { setSelectedImageUri } = useAppStore();

    const handleImageSelected = (imageUri: string) => {
        setSelectedImageUri(imageUri);
        navigation.navigate('Segmentation', { imageUri });
    };

    const handleError = (error: string) => {
        Alert.alert('Error', error, [{ text: 'OK' }]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select a Photo</Text>
                <Text style={styles.subtitle}>
                    Choose a photo to transform into a sticker
                </Text>

                <PhotoSelectionComponent
                    onImageSelected={handleImageSelected}
                    onError={handleError}
                    processingOptions={{
                        quality: 0.8,
                        maxWidth: 1024,
                        maxHeight: 1024,
                        format: 'jpeg',
                    }}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 40,
    },

});

export default PhotoSelectionScreen;