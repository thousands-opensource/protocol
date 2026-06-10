import {
    Dialog,
    IconButton,
    Typography,
    Button,
    Textarea,
} from "@material-tailwind/react";
import { ChangeEvent, useState } from "react";
import { FaXmark } from "react-icons/fa6";

interface PubNubChatReportDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    onReportMessage: (message: string) => void;
}
const PubNubChatReportDialog = ({
    open,
    setOpen,
    onReportMessage,
}: PubNubChatReportDialogProps) => {
    const [message, setMessage] = useState("");
    return (
        <Dialog size="sm" open={open}>
            <Dialog.Content className="z-[9999]">
                <Dialog.DismissTrigger
                    as={IconButton}
                    size="sm"
                    variant="ghost"
                    isCircular
                    color="secondary"
                    className="absolute right-2 top-2"
                    onClick={() => setOpen(false)}
                >
                    <FaXmark className="h-5 w-5" />
                </Dialog.DismissTrigger>
                <Typography className="text-foreground">
                    Report message
                </Typography>
                <form action="#" className="mt-6">
                    <div className="w-full space-y-1.5">
                        <Typography
                            as="label"
                            htmlFor="message"
                            type="small"
                            color="default"
                            className="font-medium"
                        >
                            Message
                        </Typography>
                        <Textarea
                            id="message"
                            placeholder="Your message..."
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                        />
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <Dialog.DismissTrigger
                            as={Button}
                            color="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Dialog.DismissTrigger>
                        <Button
                            className="bg-[#592d27]"
                            onClick={() => onReportMessage(message)}
                        >
                            Send Message
                        </Button>
                    </div>
                </form>
            </Dialog.Content>
        </Dialog>
    );
};

export default PubNubChatReportDialog;
