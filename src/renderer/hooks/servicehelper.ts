import { runService, serviceHeartbeat, stopService as kill } from '../service/app';
import { useRequest } from 'ahooks';

const useServiceHelper = () => {
  const checkHeartbeat = async () => {
    const result = await serviceHeartbeat()
    return result
  }
  const { data, run, cancel } = useRequest(checkHeartbeat, {
    pollingInterval: 500,
  });
  const startService = async ({ execPath }: { execPath: string }) => {
    runService({execPath})
  }
  const stopService = async () => {
    kill()
  }
  return {
    stopService,
    startService,
    alive: data
  }
}
export default useServiceHelper