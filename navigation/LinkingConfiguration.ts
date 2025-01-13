import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';

// Define the type of your navigation's parameter list
type RootStackParamList = {
  Root: undefined;
  NotFound: undefined;
  TabOne: undefined;
  TabTwo: undefined;
  TabOneScreen: undefined;
  TabTwoScreen: undefined;
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Root: {
        screens: {
          TabOne: {
            screens: {
              TabOneScreen: 'one',
            },
          },
          TabTwo: {
            screens: {
              TabTwoScreen: 'two',
            },
          },
        },
      },
      NotFound: '*',
    },
  },
};

export default linking;
