import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { RootStackParamList } from '@/App';
import { useAppStore } from '@/stores/appStore';

type PhotoSelectionScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'PhotoSelection'
>;

interface Props {
    navigation: PhotoSelectionScreenNavigationProp;
}

const PhotoSelectionScreen: React.FC<Props> = ({ navigation }) => {
    const { setSelectedImageUri } = useAppStore();

    const handleImageResponse = (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
            return;
        }

        if (response.assets && response.assets[0]) {
            const imageUri = response.assets[0].uri;
            if (imageUri) {
                setSelectedImageUri(imageUri);
                navigation.navigate('Segmentation', { imageUri });
            }
        }
    };

    const selectFromGallery = () => {
        launchImageLibrary(
            {
                mediaType: 'photo' as MediaType,
                quality: 0.8,
                maxWidth: 1024,
                maxHeight: 1024,
            },
            handleImageResponse,
        );
    };

    const captureFromCamera = () => {
        launchCamera(
            {
                mediaType: 'photo' as MediaType,
                quality: 0.8,
                maxWidth: 1024,
                maxHeight: 1024,
            },
            handleImageResponse,
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select a Photo</Text>
                <Text style={styles.subtitle}>
                    Choose a photo to transform into a sticker
                </Text>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={styles.optionButton}
                        onPress={selectFromGallery}>
                        <Text style={styles.optionIcon}>📷</Text>
                        <Text style={styles.optionTitle}>Gallery</Text>
                        <Text style={styles.optionSubtitle}>
                            Choose from your photos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionButton}
                        onPress={captureFromCamera}>
                        <Text style={styles.optionIcon}>📸</Text>
                        <Text style={styles.optionTitle}>Camera</Text>
                        <Text style={styles.optionSubtitle}>
                            Take a new photo
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>Tips for best results:</Text>
                    <Text style={styles.tipItem}>• Use clear, well-lit photos</Text>
                    <Text style={styles.tipItem}>• Avoid cluttered backgrounds</Text>
                    <Text style={styles.tipItem}>• Make sure the subject is visible</Text>
                </View>
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
    optionsContainer: {
        marginBottom: 40,
    },
    optionButton: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    optionIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    optionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    tipsContainer: {
        backgroundColor: '#fef3c7',
        padding: 16,
        borderRadius: 12,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 8,
    },
    tipItem: {
        fontSize: 14,
        color: '#92400e',
        marginBottom: 4,
    },
});

export default PhotoSelectionScreen;